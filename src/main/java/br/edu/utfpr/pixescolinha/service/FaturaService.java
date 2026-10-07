package br.edu.utfpr.pixescolinha.service;

import br.edu.utfpr.pixescolinha.domain.enums.StatusFatura;
import br.edu.utfpr.pixescolinha.domain.enums.TipoCobranca;
import br.edu.utfpr.pixescolinha.domain.model.*;
import br.edu.utfpr.pixescolinha.dto.FaturaEventualRequestDTO;
import br.edu.utfpr.pixescolinha.dto.FaturaMensalidadeRequestDTO;
import br.edu.utfpr.pixescolinha.dto.FaturaResponseDTO;
import br.edu.utfpr.pixescolinha.integration.AsaasPixResponseDTO;
import br.edu.utfpr.pixescolinha.integration.AsaasService;
import br.edu.utfpr.pixescolinha.repository.AlunoRepository;
import br.edu.utfpr.pixescolinha.repository.FaturaRepository;
import br.edu.utfpr.pixescolinha.repository.MatriculaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FaturaService {

    private final FaturaRepository faturaRepository;
    private final MatriculaRepository matriculaRepository;
    private final AlunoRepository alunoRepository;
    private final AsaasService asaasService;

    @Transactional
    public List<FaturaResponseDTO> gerarMensalidadesPorTurma(FaturaMensalidadeRequestDTO dto) {
        List<Matricula> matriculasAtivas = matriculaRepository.findByTurmaIdAndAtivoTrue(dto.turmaId());

        if (matriculasAtivas.isEmpty()) {
            throw new IllegalArgumentException("Nenhuma matrícula ativa encontrada para a turma ID: " + dto.turmaId());
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

            String txid = "MS" + dto.anoReferencia() + String.format("%02d", dto.mesReferencia()) + "A" + aluno.getId() + "T" + dto.turmaId();
            String descricao = String.format("Mensalidade %02d/%d - %s", dto.mesReferencia(), dto.anoReferencia(), matricula.getTurma().getNome());

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

            faturasGeradas.add(faturaRepository.save(fatura));
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
            String txid = "EV" + System.currentTimeMillis() + "A" + aluno.getId();

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

            faturasGeradas.add(faturaRepository.save(fatura));
        }

        return faturasGeradas.stream().map(FaturaResponseDTO::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<FaturaResponseDTO> listarTodas() {
        return faturaRepository.findAll().stream().map(FaturaResponseDTO::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public FaturaResponseDTO buscarPorId(Long id) {
        Fatura fatura = faturaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fatura não encontrada ID: " + id));
        return FaturaResponseDTO.fromEntity(fatura);
    }

    private Responsavel obterResponsavelPrincipal(Aluno aluno) {
        return aluno.getResponsaveis().stream()
                .filter(ar -> Boolean.TRUE.equals(ar.getFinanceiroPrincipal()))
                .findFirst()
                .map(AlunoResponsavel::getResponsavel)
                .orElseThrow(() -> new IllegalStateException("Aluno ID: " + aluno.getId() + " não possui responsável financeiro principal associado."));
    }
}