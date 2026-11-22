package br.edu.utfpr.pixescolinha.repository;

import br.edu.utfpr.pixescolinha.domain.model.Matricula;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatriculaRepository extends JpaRepository<Matricula, Long> {

    @EntityGraph(attributePaths = {
            "aluno",
            "aluno.matriculas",
            "aluno.matriculas.turma",
            "aluno.responsaveis",
            "aluno.responsaveis.responsavel",
            "turma"
    })
    @Query("SELECT DISTINCT m FROM Matricula m WHERE m.turma.id = :turmaId AND m.ativo = true AND m.aluno.ativo = true")
    List<Matricula> findByTurmaIdAndAtivoTrue(@Param("turmaId") Long turmaId);

    Optional<Matricula> findByAlunoIdAndTurmaId(Long alunoId, Long turmaId);
}