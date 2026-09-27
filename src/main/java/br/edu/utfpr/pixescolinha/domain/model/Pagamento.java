package br.edu.utfpr.pixescolinha.domain.model;

import br.edu.utfpr.pixescolinha.domain.enums.FormaPagamento;
import br.edu.utfpr.pixescolinha.domain.enums.StatusComprovante;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_pagamento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fatura_id", nullable = false, unique = true)
    private Fatura fatura;

    @Column(name = "valor_pago", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorPago;

    @Column(name = "data_pagamento", nullable = false)
    private LocalDateTime dataPagamento;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_pagamento", nullable = false, length = 30)
    private FormaPagamento formaPagamento;

    @Column(name = "transacao_id", length = 100)
    private String transacaoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_comprovante", length = 30)
    private StatusComprovante statusComprovante;

    @Column(name = "url_comprovante", length = 500)
    private String urlComprovante;

    @Column(length = 255)
    private String observacao;
}