package br.edu.utfpr.pixescolinha.consumer;

import br.edu.utfpr.pixescolinha.config.RabbitMQConfig;
import br.edu.utfpr.pixescolinha.dto.WebhookAsaasDTO;
import br.edu.utfpr.pixescolinha.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebhookConsumer {

    private final WebhookService webhookService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_WEBHOOK_ASAAS)
    public void consumirWebhookAsaas(WebhookAsaasDTO payload) {
        log.info("A processar notificação do webhook Asaas vinda da fila: {}", payload);
        try {
            webhookService.processarWebhookAsaas(payload);
        } catch (Exception e) {
            log.error("Erro ao processar mensagem da fila do webhook Asaas: ", e);
        }
    }
}