package br.edu.utfpr.pixescolinha.repository;

import br.edu.utfpr.pixescolinha.domain.model.Turma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TurmaRepository extends JpaRepository<Turma, Long> {
}