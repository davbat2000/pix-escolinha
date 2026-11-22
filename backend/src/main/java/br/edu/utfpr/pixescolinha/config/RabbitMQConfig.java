package br.edu.utfpr.pixescolinha.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String QUEUE_WEBHOOK_ASAAS = "queue.webhook.asaas";
    public static final String EXCHANGE_WEBHOOK = "exchange.webhook";
    public static final String ROUTING_KEY_ASAAS = "routing.key.asaas";

    // Cria a fila durável (não se perde se o RabbitMQ reiniciar)
    @Bean
    public Queue queueAsaas() {
        return QueueBuilder.durable(QUEUE_WEBHOOK_ASAAS).build();
    }

    // Cria a Exchange do tipo Direta
    @Bean
    public DirectExchange exchangeWebhook() {
        return new DirectExchange(EXCHANGE_WEBHOOK);
    }

    // Vincula a Fila à Exchange utilizando a Routing Key
    @Bean
    public Binding bindingAsaas(Queue queueAsaas, DirectExchange exchangeWebhook) {
        return BindingBuilder.bind(queueAsaas).to(exchangeWebhook).with(ROUTING_KEY_ASAAS);
    }

    // Configura o Spring para converter objetos Java para JSON ao enviar mensagens
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}