package br.edu.utfpr.pixescolinha.repository;

import br.edu.utfpr.pixescolinha.domain.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    Optional<Aluno> findByMatriculaCodigo(String matriculaCodigo);
    boolean existsByMatriculaCodigo(String matriculaCodigo);
}
