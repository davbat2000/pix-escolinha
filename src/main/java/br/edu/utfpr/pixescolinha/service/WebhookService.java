package br.edu.utfpr.pixescolinha.service;

import br.edu.utfpr.pixescolinha.domain.enums.FormaPagamento;
import br.edu.utfpr.pixescolinha.domain.enums.StatusComprovante;
import br.edu.utfpr.pixescolinha.domain.enums.StatusFatura;
import br.edu.utfpr.pixescolinha.domain.model.Fatura;
import br.edu.utfpr.pixescolinha.domain.model.Pagamento;
import br.edu.utfpr.pixescolinha.domain.model.RegistroWebhook;
import br.edu.utfpr.pixescolinha.dto.WebhookAsaasDTO;
import br.edu.utfpr.pixescolinha.repository.FaturaRepository;
import br.edu.utfpr.pixescolinha.repository.PagamentoRepository;
import br.edu.utfpr.pixescolinha.repository.RegistroWebhookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WebhookService {

    private final FaturaRepository faturaRepository;
    private final PagamentoRepository pagamentoRepository;
    private final RegistroWebhookRepository registroWebhookRepository;

    @Transactional
    public void processarWebhookAsaas(WebhookAsaasDTO dto) {
        if (dto == null || dto.payment() == null) {
            return;
        }

        String paymentId = dto.payment().id();
        String eventType = dto.event();
        String eventId = paymentId + "_" + eventType;

        // Garantia de Idempotência: Se o evento já foi processado, ignora
        if (registroWebhookRepository.existsById(eventId)) {
            return;
        }

        // Processa eventos de confirmação/receção do pagamento Pix
        if ("PAYMENT_RECEIVED".equals(eventType) || "PAYMENT_CONFIRMED".equals(eventType)) {
            Fatura fatura = faturaRepository.findByExternalPaymentId(paymentId)
                    .orElseGet(() -> faturaRepository.findByTxid(dto.payment().externalReference())
                            .orElse(null));

            if (fatura != null && fatura.getStatus() != StatusFatura.PAGA) {
                fatura.setStatus(StatusFatura.PAGA);
                faturaRepository.save(fatura);

                Pagamento pagamento = Pagamento.builder()
                        .fatura(fatura)
                        .valorPago(dto.payment().value())
                        .dataPagamento(LocalDateTime.now())
                        .formaPagamento(FormaPagamento.PIX)
                        .transacaoId(paymentId)
                        .statusComprovante(StatusComprovante.NAO_REQUERIDO)
                        .observacao("Pagamento confirmado via Webhook Asaas (" + eventType + ")")
                        .build();

                pagamentoRepository.save(pagamento);
            }
        }

        // Regista o evento como processado
        RegistroWebhook registro = RegistroWebhook.builder()
                .eventId(eventId)
                .dataRecebimento(LocalDateTime.now())
                .processado(true)
                .build();

        registroWebhookRepository.save(registro);
    }
}