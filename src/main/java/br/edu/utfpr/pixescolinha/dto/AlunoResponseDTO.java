package br.edu.utfpr.pixescolinha.dto;

import br.edu.utfpr.pixescolinha.domain.enums.Parentesco;
import br.edu.utfpr.pixescolinha.domain.model.Aluno;
import java.math.BigDecimal;
import java.util.List;

public record AlunoResponseDTO(
        Long id,
        String nome,
        String matriculaCodigo,
        Boolean ativo,
        List<String> turmas,
        List<MatriculaResumoDTO> matriculasAtivas,
        Long responsavelPrincipalId,
        Parentesco parentesco,
        String responsavelPrincipalNome,
        String responsavelPrincipalWhatsapp
) {
    public record MatriculaResumoDTO(
            Long matriculaId,
            Long turmaId,
            String turmaNome,
            BigDecimal porcentagemBolsa
    ) {}

    public static AlunoResponseDTO fromEntity(Aluno aluno) {
        List<MatriculaResumoDTO> matriculasResumo = aluno.getMatriculas().stream()
                .filter(m -> Boolean.TRUE.equals(m.getAtivo()))
                .map(m -> new MatriculaResumoDTO(
                        m.getId(),
                        m.getTurma().getId(),
                        m.getTurma().getNome(),
                        m.getPorcentagemBolsa()
                ))
                .toList();

        List<String> nomesTurmas = matriculasResumo.stream()
                .map(MatriculaResumoDTO::turmaNome)
                .toList();

        var vinculoPrincipal = aluno.getResponsaveis().stream()
                .filter(ar -> Boolean.TRUE.equals(ar.getFinanceiroPrincipal()))
                .findFirst();

        var respPrincipal = vinculoPrincipal.map(ar -> ar.getResponsavel());

        return new AlunoResponseDTO(
                aluno.getId(),
                aluno.getNome(),
                aluno.getMatriculaCodigo(),
                aluno.getAtivo(),
                nomesTurmas,
                matriculasResumo,
                respPrincipal.map(r -> r.getId()).orElse(null),
                vinculoPrincipal.map(ar -> ar.getParentesco()).orElse(Parentesco.PAI),
                respPrincipal.map(r -> r.getNome()).orElse("Não informado"),
                respPrincipal.map(r -> r.getWhatsapp()).orElse("Não informado")
        );
    }
}