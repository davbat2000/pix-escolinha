package br.edu.utfpr.pixescolinha.dto;

import br.edu.utfpr.pixescolinha.domain.enums.StatusFatura;
import br.edu.utfpr.pixescolinha.domain.enums.TipoCobranca;
import br.edu.utfpr.pixescolinha.domain.model.Fatura;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record FaturaResponseDTO(
        Long id,
        String txid,
        String alunoNome,
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
        String qrCodeBase64
) {
    public static FaturaResponseDTO fromEntity(Fatura fatura) {
        return new FaturaResponseDTO(
                fatura.getId(),
                fatura.getTxid(),
                fatura.getAluno().getNome(),
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
                fatura.getQrCodeBase64()
        );
    }
}