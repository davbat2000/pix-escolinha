package br.edu.utfpr.pixescolinha.dto;

import br.edu.utfpr.pixescolinha.domain.model.Aluno;

import java.util.List;

public record AlunoResponseDTO(
        Long id,
        String nome,
        String matriculaCodigo,
        Boolean ativo,
        List<String> turmas,
        String responsavelPrincipalNome,
        String responsavelPrincipalWhatsapp
) {
    public static AlunoResponseDTO fromEntity(Aluno aluno) {
        List<String> nomesTurmas = aluno.getMatriculas().stream()
                .filter(m -> Boolean.TRUE.equals(m.getAtivo()))
                .map(m -> m.getTurma().getNome())
                .toList();

        var respPrincipal = aluno.getResponsaveis().stream()
                .filter(ar -> Boolean.TRUE.equals(ar.getFinanceiroPrincipal()))
                .findFirst()
                .map(ar -> ar.getResponsavel());

        return new AlunoResponseDTO(
                aluno.getId(),
                aluno.getNome(),
                aluno.getMatriculaCodigo(),
                aluno.getAtivo(),
                nomesTurmas,
                respPrincipal.map(r -> r.getNome()).orElse("Não informado"),
                respPrincipal.map(r -> r.getWhatsapp()).orElse("Não informado")
        );
    }
}