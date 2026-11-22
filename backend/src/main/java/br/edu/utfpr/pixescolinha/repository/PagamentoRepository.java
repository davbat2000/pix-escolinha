package br.edu.utfpr.pixescolinha.repository;

import br.edu.utfpr.pixescolinha.domain.model.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {
    Optional<Pagamento> findByFaturaId(Long faturaId);
}