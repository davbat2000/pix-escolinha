package br.edu.utfpr.pixescolinha.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
        name = "tb_matricula",
        uniqueConstraints = @UniqueConstraint(columnNames = {"aluno_id", "turma_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Matricula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    @Column(name = "porcentagem_bolsa", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal porcentagemBolsa = BigDecimal.ZERO;

    @Column(name = "data_matricula", nullable = false)
    private LocalDate dataMatricula;

    @Builder.Default
    @Column(nullable = false)
    private Boolean ativo = true;
}