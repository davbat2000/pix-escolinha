package br.edu.utfpr.pixescolinha.dto;

import java.math.BigDecimal;

public record WebhookAsaasDTO(
        String event,
        PaymentData payment
) {
    public record PaymentData(
            String id,
            String customer,
            BigDecimal value,
            BigDecimal netValue,
            String status,
            String externalReference,
            String billingType,
            String paymentDate,
            String clientPaymentDate
    ) {}
}