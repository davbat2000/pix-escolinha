package br.edu.utfpr.pixescolinha.controller;

import br.edu.utfpr.pixescolinha.dto.FaturaEventualRequestDTO;
import br.edu.utfpr.pixescolinha.dto.FaturaMensalidadeRequestDTO;
import br.edu.utfpr.pixescolinha.dto.FaturaResponseDTO;
import br.edu.utfpr.pixescolinha.service.FaturaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faturas")
@RequiredArgsConstructor
public class FaturaController {

    private final FaturaService faturaService;

    @PostMapping("/mensalidades")
    public ResponseEntity<List<FaturaResponseDTO>> gerarMensalidades(@RequestBody @Valid FaturaMensalidadeRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(faturaService.gerarMensalidadesPorTurma(dto));
    }

    @PostMapping("/eventuais")
    public ResponseEntity<List<FaturaResponseDTO>> gerarEventual(@RequestBody @Valid FaturaEventualRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(faturaService.gerarCobrancaEventual(dto));
    }

    @GetMapping
    public ResponseEntity<List<FaturaResponseDTO>> listarTodas() {
        return ResponseEntity.ok(faturaService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FaturaResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(faturaService.buscarPorId(id));
    }
}