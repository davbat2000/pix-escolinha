package br.edu.utfpr.pixescolinha.integration;

import java.math.BigDecimal;

public record AsaasPixResponseDTO(
        String externalPaymentId,
        String txid,
        String qrCodePix,
        String qrCodeBase64,
        BigDecimal valor,
        String status
) {}