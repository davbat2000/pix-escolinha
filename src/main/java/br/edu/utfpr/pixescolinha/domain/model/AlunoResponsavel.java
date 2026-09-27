package br.edu.utfpr.pixescolinha.domain.model;

import br.edu.utfpr.pixescolinha.domain.enums.Parentesco;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "tb_aluno_responsavel",
        uniqueConstraints = @UniqueConstraint(columnNames = {"aluno_id", "responsavel_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class AlunoResponsavel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsavel_id", nullable = false)
    private Responsavel responsavel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Parentesco parentesco;

    @Column(name = "financeiro_principal", nullable = false)
    private Boolean financeiroPrincipal;
}