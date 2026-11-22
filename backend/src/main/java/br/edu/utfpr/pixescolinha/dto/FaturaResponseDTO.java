package br.edu.utfpr.pixescolinha.dto;

import br.edu.utfpr.pixescolinha.domain.enums.FormaPagamento;
import br.edu.utfpr.pixescolinha.domain.enums.StatusComprovante;
import br.edu.utfpr.pixescolinha.domain.enums.StatusFatura;
import br.edu.utfpr.pixescolinha.domain.enums.TipoCobranca;
import br.edu.utfpr.pixescolinha.domain.model.Fatura;
import br.edu.utfpr.pixescolinha.domain.model.Matricula;
import br.edu.utfpr.pixescolinha.domain.model.Pagamento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record FaturaResponseDTO(
        Long id,
        String txid,
        Long alunoId,
        String alunoNome,
        String alunoMatricula,
        Long turmaId,
        String turmaNome,
        String responsavelNome,
        String responsavelWhatsapp,
        String descricao,
        TipoCobranca tipoCobranca,
        BigDecimal valorOriginal,
        BigDecimal valorDesconto,
        BigDecimal valorFinal,
        LocalDateTime dataEmissao,
        LocalDate dataVencimento,
        StatusFatura status,
        String qrCodePix,
        String qrCodeBase64,
        String externalPaymentId,
        PagamentoResumoDTO pagamento
) {
    public record PagamentoResumoDTO(
            Long id,
            BigDecimal valorPago,
            LocalDateTime dataPagamento,
            FormaPagamento formaPagamento,
            String transacaoId,
            StatusComprovante statusComprovante,
            String urlComprovante,
            String observacao,
            boolean possuiArquivoLocal
    ) {}

    public static FaturaResponseDTO fromEntity(Fatura fatura) {
        return fromEntity(fatura, null);
    }

    public static FaturaResponseDTO fromEntity(Fatura fatura, Pagamento pag) {
        Matricula mat = fatura.getMatricula();
        Long tId = (mat != null && mat.getTurma() != null) ? mat.getTurma().getId() : null;
        String tNome = (mat != null && mat.getTurma() != null) ? mat.getTurma().getNome() : null;

        if (tNome == null && fatura.getAluno() != null && fatura.getAluno().getMatriculas() != null) {
            var primeiraMat = fatura.getAluno().getMatriculas().stream()
                    .filter(m -> Boolean.TRUE.equals(m.getAtivo()))
                    .findFirst()
                    .orElse(null);
            if (primeiraMat != null && primeiraMat.getTurma() != null) {
                tId = primeiraMat.getTurma().getId();
                tNome = primeiraMat.getTurma().getNome();
            }
        }

        PagamentoResumoDTO pagDto = null;
        if (pag != null) {
            boolean arquivoLocal = pag.getUrlComprovante() != null
                    && !pag.getUrlComprovante().startsWith("http");
            pagDto = new PagamentoResumoDTO(
                    pag.getId(),
                    pag.getValorPago(),
                    pag.getDataPagamento(),
                    pag.getFormaPagamento(),
                    pag.getTransacaoId(),
                    pag.getStatusComprovante(),
                    pag.getUrlComprovante(),
                    pag.getObservacao(),
                    arquivoLocal
            );
        }

        return new FaturaResponseDTO(
                fatura.getId(),
                fatura.getTxid(),
                fatura.getAluno().getId(),
                fatura.getAluno().getNome(),
                fatura.getAluno().getMatriculaCodigo(),
                tId,
                tNome != null ? tNome : "Cobranças Avulsas / Geral",
                fatura.getResponsavel().getNome(),
                fatura.getResponsavel().getWhatsapp(),
                fatura.getDescricao(),
                fatura.getTipoCobranca(),
                fatura.getValorOriginal(),
                fatura.getValorDesconto(),
                fatura.getValorFinal(),
                fatura.getDataEmissao(),
                fatura.getDataVencimento(),
                fatura.getStatus(),
                fatura.getQrCodePix(),
                fatura.getQrCodeBase64(),
                fatura.getExternalPaymentId(),
                pagDto
        );
    }
}