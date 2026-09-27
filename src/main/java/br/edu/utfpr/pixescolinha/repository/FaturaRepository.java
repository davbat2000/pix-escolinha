package br.edu.utfpr.pixescolinha.repository;

import br.edu.utfpr.pixescolinha.domain.enums.StatusFatura;
import br.edu.utfpr.pixescolinha.domain.model.Fatura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FaturaRepository extends JpaRepository<Fatura, Long> {
    Optional<Fatura> findByTxid(String txid);
    List<Fatura> findByStatus(StatusFatura status);
    List<Fatura> findByAlunoId(Long alunoId);
}