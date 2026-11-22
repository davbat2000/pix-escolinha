package br.edu.utfpr.pixescolinha.service;

import br.edu.utfpr.pixescolinha.domain.enums.FormaPagamento;
import br.edu.utfpr.pixescolinha.domain.enums.StatusComprovante;
import br.edu.utfpr.pixescolinha.domain.enums.StatusFatura;
import br.edu.utfpr.pixescolinha.domain.enums.TipoCobranca;
import br.edu.utfpr.pixescolinha.domain.model.*;
import br.edu.utfpr.pixescolinha.dto.ComprovanteRequestDTO;
import br.edu.utfpr.pixescolinha.dto.FaturaEventualRequestDTO;
import br.edu.utfpr.pixescolinha.dto.FaturaMensalidadeRequestDTO;
import br.edu.utfpr.pixescolinha.dto.FaturaResponseDTO;
import br.edu.utfpr.pixescolinha.integration.AsaasPixResponseDTO;
import br.edu.utfpr.pixescolinha.integration.AsaasService;
import br.edu.utfpr.pixescolinha.integration.EvolutionService;
import br.edu.utfpr.pixescolinha.repository.AlunoRepository;
import br.edu.utfpr.pixescolinha.repository.FaturaRepository;
import br.edu.utfpr.pixescolinha.repository.MatriculaRepository;
import br.edu.utfpr.pixescolinha.repository.PagamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FaturaService {

    private final FaturaRepository faturaRepository;
    private final MatriculaRepository matriculaRepository;
    private final AlunoRepository alunoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final AsaasService asaasService;
    private final EvolutionService evolutionService;

    @Value("${app.storage.comprovantes-dir:uploads/comprovantes}")
    private String diretorioComprovantes;

    @Transactional
    public List<FaturaResponseDTO> gerarMensalidadesPorTurma(FaturaMensalidadeRequestDTO dto) {
        List<Matricula> matriculasAtivas = matriculaRepository.findByTurmaIdAndAtivoTrue(dto.turmaId());

        if (dto.alunoId() != null) {
            matriculasAtivas = matriculasAtivas.stream()
                    .filter(m -> m.getAluno().getId().equals(dto.alunoId()))
                    .toList();
        }

        if (matriculasAtivas.isEmpty()) {
            throw new IllegalArgumentException(
                    dto.alunoId() != null
                            ? "O aluno selecionado não possui matrícula ativa nesta turma."
                            : "Nenhuma matrícula ativa encontrada para a turma ID: " + dto.turmaId()
            );
        }

        List<Fatura> faturasGeradas = new ArrayList<>();

        for (Matricula matricula : matriculasAtivas) {
            Aluno aluno = matricula.getAluno();
            Responsavel responsavelPrincipal = obterResponsavelPrincipal(aluno);

            BigDecimal valorBase = matricula.getTurma().getValorMensalidadePadrao();
            BigDecimal percentualBolsa = matricula.getPorcentagemBolsa() != null ? matricula.getPorcentagemBolsa() : BigDecimal.ZERO;

            BigDecimal valorDesconto = valorBase.multiply(percentualBolsa)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal valorFinal = valorBase.subtract(valorDesconto);

            String txid = gerarTxidUnico("MS");
            String descricao = String.format("Mensalidade %02d/%d - %s",
                    dto.mesReferencia(), dto.anoReferencia(), matricula.getTurma().getNome());

            AsaasPixResponseDTO pix = asaasService.gerarPixDinamico(
                    txid, valorFinal, descricao, responsavelPrincipal.getCpf(), responsavelPrincipal.getNome(), dto.dataVencimento()
            );

            Fatura fatura = Fatura.builder()
                    .txid(txid)
                    .aluno(aluno)
                    .responsavel(responsavelPrincipal)
                    .matricula(matricula)
                    .descricao(descricao)
                    .tipoCobranca(TipoCobranca.MENSALIDADE)
                    .valorOriginal(valorBase)
                    .valorDesconto(valorDesconto)
                    .valorFinal(valorFinal)
                    .dataEmissao(LocalDateTime.now())
                    .dataVencimento(dto.dataVencimento())
                    .status(StatusFatura.PENDENTE)
                    .qrCodePix(pix.qrCodePix())
                    .qrCodeBase64(pix.qrCodeBase64())
                    .externalPaymentId(pix.externalPaymentId())
                    .build();

            Fatura faturaSalva = faturaRepository.save(fatura);
            faturasGeradas.add(faturaSalva);

            evolutionService.enviarCobrancaPix(
                    responsavelPrincipal.getWhatsapp(),
                    responsavelPrincipal.getNome(),
                    aluno.getNome(),
                    descricao,
                    valorFinal,
                    dto.dataVencimento(),
                    pix.qrCodePix()
            );
        }

        return faturasGeradas.stream().map(FaturaResponseDTO::fromEntity).toList();
    }

    @Transactional
    public List<FaturaResponseDTO> gerarCobrancaEventual(FaturaEventualRequestDTO dto) {
        Set<Aluno> alunosParaCobrar = new HashSet<>();

        if (dto.turmaId() != null) {
            List<Matricula> matriculas = matriculaRepository.findByTurmaIdAndAtivoTrue(dto.turmaId());
            matriculas.forEach(m -> alunosParaCobrar.add(m.getAluno()));
        }

        if (dto.alunoIds() != null && !dto.alunoIds().isEmpty()) {
            List<Aluno> alunosEspecificos = alunoRepository.findAllById(dto.alunoIds());
            alunosParaCobrar.addAll(alunosEspecificos);
        }

        if (alunosParaCobrar.isEmpty()) {
            throw new IllegalArgumentException("Nenhum aluno selecionado ou encontrado para a cobrança eventual.");
        }

        List<Fatura> faturasGeradas = new ArrayList<>();

        for (Aluno aluno : alunosParaCobrar) {
            Responsavel responsavel = obterResponsavelPrincipal(aluno);
            String txid = gerarTxidUnico("EV");

            AsaasPixResponseDTO pix = asaasService.gerarPixDinamico(
                    txid, dto.valor(), dto.descricao(), responsavel.getCpf(), responsavel.getNome(), dto.dataVencimento()
            );

            Fatura fatura = Fatura.builder()
                    .txid(txid)
                    .aluno(aluno)
                    .responsavel(responsavel)
                    .descricao(dto.descricao())
                    .tipoCobranca(dto.tipoCobranca())
                    .valorOriginal(dto.valor())
                    .valorDesconto(BigDecimal.ZERO)
                    .valorFinal(dto.valor())
                    .dataEmissao(LocalDateTime.now())
                    .dataVencimento(dto.dataVencimento())
                    .status(StatusFatura.PENDENTE)
                    .qrCodePix(pix.qrCodePix())
                    .qrCodeBase64(pix.qrCodeBase64())
                    .externalPaymentId(pix.externalPaymentId())
                    .build();

            Fatura faturaSalva = faturaRepository.save(fatura);
            faturasGeradas.add(faturaSalva);

            evolutionService.enviarCobrancaPix(
                    responsavel.getWhatsapp(),
                    responsavel.getNome(),
                    aluno.getNome(),
                    dto.descricao(),
                    dto.valor(),
                    dto.dataVencimento(),
                    pix.qrCodePix()
            );
        }

        return faturasGeradas.stream().map(FaturaResponseDTO::fromEntity).toList();
    }

    @Transactional
    public FaturaResponseDTO uploadArquivoComprovante(Long faturaId, MultipartFile arquivo, FormaPagamento formaPagamento, String observacao, boolean aprovarImediatamente) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("Nenhum arquivo de comprovante foi selecionado.");
        }

        Fatura fatura = faturaRepository.findById(faturaId)
                .orElseThrow(() -> new IllegalArgumentException("Fatura não encontrada ID: " + faturaId));

        try {
            Path pastaDestino = Paths.get(diretorioComprovantes).toAbsolutePath().normalize();
            Files.createDirectories(pastaDestino);

            String nomeOriginal = arquivo.getOriginalFilename() != null ? arquivo.getOriginalFilename() : "comprovante.pdf";
            String extensao = "";
            int idxPonto = nomeOriginal.lastIndexOf('.');
            if (idxPonto >= 0) {
                extensao = nomeOriginal.substring(idxPonto).toLowerCase();
            }

            String nomeArquivoSalvo = "fatura_" + faturaId + "_" + System.currentTimeMillis() + extensao;
            Path caminhoCompleto = pastaDestino.resolve(nomeArquivoSalvo);

            Files.copy(arquivo.getInputStream(), caminhoCompleto, StandardCopyOption.REPLACE_EXISTING);

            Pagamento pagamento = pagamentoRepository.findByFaturaId(faturaId)
                    .orElse(Pagamento.builder().fatura(fatura).build());

            pagamento.setValorPago(fatura.getValorFinal());
            pagamento.setDataPagamento(LocalDateTime.now());
            pagamento.setFormaPagamento(formaPagamento != null ? formaPagamento : FormaPagamento.PIX);
            pagamento.setUrlComprovante(nomeArquivoSalvo);

            if (pagamento.getTransacaoId() == null) {
                pagamento.setTransacaoId("COMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            }

            if (aprovarImediatamente) {
                fatura.setStatus(StatusFatura.PAGA);
                pagamento.setStatusComprovante(StatusComprovante.APROVADO);
                pagamento.setObservacao(observacao != null && !observacao.isBlank()
                        ? observacao
                        : "Comprovante recebido via WhatsApp/E-mail e aprovado pela secretaria");

                evolutionService.enviarConfirmacaoPagamento(
                        fatura.getResponsavel().getWhatsapp(),
                        fatura.getResponsavel().getNome(),
                        fatura.getDescricao(),
                        fatura.getValorFinal()
                );
            } else {
                fatura.setStatus(StatusFatura.EM_ANALISE_MANUAL);
                pagamento.setStatusComprovante(StatusComprovante.PENDENTE_APROVACAO);
                pagamento.setObservacao(observacao != null && !observacao.isBlank()
                        ? observacao
                        : "Comprovante anexado localmente aguardando conferência");
            }

            faturaRepository.save(fatura);
            Pagamento salvo = pagamentoRepository.save(pagamento);

            return FaturaResponseDTO.fromEntity(fatura, salvo);
        } catch (IOException e) {
            throw new RuntimeException("Falha ao salvar o arquivo do comprovante no diretório local: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Resource carregarArquivoComprovante(Long faturaId) {
        Pagamento pagamento = pagamentoRepository.findByFaturaId(faturaId)
                .orElseThrow(() -> new IllegalArgumentException("Nenhum comprovante registrado para a fatura ID: " + faturaId));

        if (pagamento.getUrlComprovante() == null || pagamento.getUrlComprovante().startsWith("http")) {
            throw new IllegalArgumentException("Esta fatura não possui arquivo físico salvo no diretório local.");
        }

        try {
            Path pastaDestino = Paths.get(diretorioComprovantes).toAbsolutePath().normalize();
            Path caminhoArquivo = pastaDestino.resolve(pagamento.getUrlComprovante()).normalize();
            Resource resource = new UrlResource(caminhoArquivo.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new IllegalArgumentException("Arquivo de comprovante não encontrado no disco: " + pagamento.getUrlComprovante());
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Erro ao ler arquivo do comprovante: " + e.getMessage());
        }
    }

    @Transactional
    public FaturaResponseDTO registrarComprovanteManual(Long faturaId, ComprovanteRequestDTO dto) {
        Fatura fatura = faturaRepository.findById(faturaId)
                .orElseThrow(() -> new IllegalArgumentException("Fatura não encontrada ID: " + faturaId));

        fatura.setStatus(StatusFatura.EM_ANALISE_MANUAL);
        faturaRepository.save(fatura);

        Pagamento pagamento = pagamentoRepository.findByFaturaId(faturaId)
                .orElse(Pagamento.builder().fatura(fatura).build());

        pagamento.setValorPago(fatura.getValorFinal());
        pagamento.setDataPagamento(LocalDateTime.now());
        pagamento.setFormaPagamento(dto.formaPagamento() != null ? dto.formaPagamento() : FormaPagamento.TRANSFERENCIA);
        pagamento.setStatusComprovante(StatusComprovante.PENDENTE_APROVACAO);
        pagamento.setUrlComprovante(dto.urlComprovante());
        pagamento.setObservacao(dto.observacao() != null ? dto.observacao() : "Comprovante enviado para análise manual");

        Pagamento salvo = pagamentoRepository.save(pagamento);
        return FaturaResponseDTO.fromEntity(fatura, salvo);
    }

    @Transactional
    public FaturaResponseDTO aprovarOuBaixarManualmente(Long faturaId) {
        Fatura fatura = faturaRepository.findById(faturaId)
                .orElseThrow(() -> new IllegalArgumentException("Fatura não encontrada ID: " + faturaId));

        fatura.setStatus(StatusFatura.PAGA);
        faturaRepository.save(fatura);

        Pagamento pagamento = pagamentoRepository.findByFaturaId(faturaId)
                .orElse(Pagamento.builder()
                        .fatura(fatura)
                        .valorPago(fatura.getValorFinal())
                        .dataPagamento(LocalDateTime.now())
                        .formaPagamento(FormaPagamento.DINHEIRO)
                        .transacaoId("MANUAL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .build());

        pagamento.setStatusComprovante(StatusComprovante.APROVADO);
        if (pagamento.getObservacao() == null) {
            pagamento.setObservacao("Baixa manual aprovada pela secretaria");
        }
        Pagamento salvo = pagamentoRepository.save(pagamento);

        evolutionService.enviarConfirmacaoPagamento(
                fatura.getResponsavel().getWhatsapp(),
                fatura.getResponsavel().getNome(),
                fatura.getDescricao(),
                fatura.getValorFinal()
        );

        return FaturaResponseDTO.fromEntity(fatura, salvo);
    }

    @Transactional
    public FaturaResponseDTO rejeitarComprovante(Long faturaId, String motivo) {
        Fatura fatura = faturaRepository.findById(faturaId)
                .orElseThrow(() -> new IllegalArgumentException("Fatura não encontrada ID: " + faturaId));

        fatura.setStatus(StatusFatura.PENDENTE);
        faturaRepository.save(fatura);

        Pagamento pagamento = pagamentoRepository.findByFaturaId(faturaId).orElse(null);
        if (pagamento != null) {
            pagamento.setStatusComprovante(StatusComprovante.REJEITADO);
            pagamento.setObservacao(motivo != null && !motivo.isBlank() ? motivo : "Comprovante rejeitado pela secretaria.");
            pagamentoRepository.save(pagamento);
        }

        return FaturaResponseDTO.fromEntity(fatura, pagamento);
    }

    @Transactional
    public FaturaResponseDTO cancelarFatura(Long faturaId) {
        Fatura fatura = faturaRepository.findById(faturaId)
                .orElseThrow(() -> new IllegalArgumentException("Fatura não encontrada ID: " + faturaId));

        if (fatura.getStatus() == StatusFatura.PAGA) {
            throw new IllegalStateException("Não é possível cancelar uma fatura já paga.");
        }

        fatura.setStatus(StatusFatura.CANCELADA);
        Pagamento pag = pagamentoRepository.findByFaturaId(faturaId).orElse(null);
        return FaturaResponseDTO.fromEntity(faturaRepository.save(fatura), pag);
    }

    @Transactional(readOnly = true)
    public List<FaturaResponseDTO> listarTodas() {
        List<Fatura> faturas = faturaRepository.findAll();
        Map<Long, Pagamento> mapaPagamentos = pagamentoRepository.findAll().stream()
                .collect(Collectors.toMap(p -> p.getFatura().getId(), Function.identity(), (a, b) -> a));

        return faturas.stream()
                .map(f -> FaturaResponseDTO.fromEntity(f, mapaPagamentos.get(f.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public FaturaResponseDTO buscarPorId(Long id) {
        Fatura fatura = faturaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fatura não encontrada ID: " + id));
        Pagamento pag = pagamentoRepository.findByFaturaId(id).orElse(null);
        return FaturaResponseDTO.fromEntity(fatura, pag);
    }

    private String gerarTxidUnico(String prefixo) {
        String uuidLimpo = UUID.randomUUID().toString().replace("-", "").toUpperCase();
        return prefixo + uuidLimpo.substring(0, 24);
    }

    private Responsavel obterResponsavelPrincipal(Aluno aluno) {
        return aluno.getResponsaveis().stream()
                .filter(ar -> Boolean.TRUE.equals(ar.getFinanceiroPrincipal()))
                .findFirst()
                .map(AlunoResponsavel::getResponsavel)
                .orElseThrow(() -> new IllegalStateException(
                        "Aluno ID: " + aluno.getId() + " não possui responsável financeiro principal associado."));
    }
}