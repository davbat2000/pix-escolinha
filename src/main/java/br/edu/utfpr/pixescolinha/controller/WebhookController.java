package br.edu.utfpr.pixescolinha.controller;

import br.edu.utfpr.pixescolinha.config.RabbitMQConfig;
import br.edu.utfpr.pixescolinha.dto.WebhookAsaasDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final RabbitTemplate rabbitTemplate;

    @PostMapping("/asaas")
    public ResponseEntity<Void> receberWebhookAsaas(@RequestBody WebhookAsaasDTO payload) {
        // Envia a mensagem para a Exchange do RabbitMQ
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_WEBHOOK,
                RabbitMQConfig.ROUTING_KEY_ASAAS,
                payload
        );

        // Retorna HTTP 200 de imediato (< 50ms) atendendo ao RNF05
        return ResponseEntity.ok().build();
    }
}