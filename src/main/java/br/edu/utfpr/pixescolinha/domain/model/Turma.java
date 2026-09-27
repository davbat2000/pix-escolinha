package br.edu.utfpr.pixescolinha.domain.model;

import br.edu.utfpr.pixescolinha.domain.enums.Turno;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tb_turma")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Turma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Turno turno;

    @Column(name = "valor_mensalidade_padrao", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorMensalidadePadrao;

    @Column(name = "dia_vencimento_padrao", nullable = false)
    private Integer diaVencimentoPadrao;
}