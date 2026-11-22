package br.edu.utfpr.pixescolinha.repository;

import br.edu.utfpr.pixescolinha.domain.model.Aluno;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlunoRepository extends JpaRepository<Aluno, Long> {

    @Override
    @EntityGraph(attributePaths = {"matriculas", "matriculas.turma", "responsaveis", "responsaveis.responsavel"})
    List<Aluno> findAll();

    @Override
    @EntityGraph(attributePaths = {"matriculas", "matriculas.turma", "responsaveis", "responsaveis.responsavel"})
    List<Aluno> findAllById(Iterable<Long> ids);

    Optional<Aluno> findByMatriculaCodigo(String matriculaCodigo);
    boolean existsByMatriculaCodigo(String matriculaCodigo);
}