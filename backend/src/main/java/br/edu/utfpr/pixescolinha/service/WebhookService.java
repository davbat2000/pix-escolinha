package br.edu.utfpr.pixescolinha.service;

import br.edu.utfpr.pixescolinha.domain.enums.FormaPagamento;
import br.edu.utfpr.pixescolinha.domain.enums.StatusComprovante;
import br.edu.utfpr.pixescolinha.domain.enums.StatusFatura;
import br.edu.utfpr.pixescolinha.domain.model.Fatura;
import br.edu.utfpr.pixescolinha.domain.model.Pagamento;
import br.edu.utfpr.pixescolinha.domain.model.RegistroWebhook;
import br.edu.utfpr.pixescolinha.dto.WebhookAsaasDTO;
import br.edu.utfpr.pixescolinha.integration.EvolutionService;
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
    private final EvolutionService evolutionService;

    @Transactional
    public void processarWebhookAsaas(WebhookAsaasDTO dto) {
        if (dto == null || dto.payment() == null) {
            return;
        }

        String paymentId = dto.payment().id();
        String eventType = dto.event();
        String eventId = paymentId + "_" + eventType;

        if (registroWebhookRepository.existsById(eventId)) {
            return;
        }

        if ("PAYMENT_RECEIVED".equals(eventType) || "PAYMENT_CONFIRMED".equals(eventType)) {
            Fatura fatura = faturaRepository.findByExternalPaymentId(paymentId)
                    .orElseGet(() -> dto.payment().externalReference() != null
                            ? faturaRepository.findByTxid(dto.payment().externalReference()).orElse(null)
                            : null);

            if (fatura != null && fatura.getStatus() != StatusFatura.PAGA) {
                fatura.setStatus(StatusFatura.PAGA);
                faturaRepository.save(fatura);

                Pagamento pagamento = pagamentoRepository.findByFaturaId(fatura.getId())
                        .orElse(Pagamento.builder().fatura(fatura).build());

                pagamento.setValorPago(dto.payment().value() != null ? dto.payment().value() : fatura.getValorFinal());
                pagamento.setDataPagamento(LocalDateTime.now());
                pagamento.setFormaPagamento(FormaPagamento.PIX);
                pagamento.setTransacaoId(paymentId);
                pagamento.setStatusComprovante(StatusComprovante.APROVADO);
                if (dto.payment().transactionReceiptUrl() != null && !dto.payment().transactionReceiptUrl().isBlank()) {
                    pagamento.setUrlComprovante(dto.payment().transactionReceiptUrl());
                }
                pagamento.setObservacao("Pagamento confirmado automaticamente via Webhook Asaas (" + eventType + ")");

                pagamentoRepository.save(pagamento);

                evolutionService.enviarConfirmacaoPagamento(
                        fatura.getResponsavel().getWhatsapp(),
                        fatura.getResponsavel().getNome(),
                        fatura.getDescricao(),
                        fatura.getValorFinal()
                );
            }
        }

        RegistroWebhook registro = RegistroWebhook.builder()
                .eventId(eventId)
                .dataRecebimento(LocalDateTime.now())
                .processado(true)
                .build();

        registroWebhookRepository.save(registro);
    }
}