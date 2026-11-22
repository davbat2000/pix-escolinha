package br.edu.utfpr.pixescolinha.controller;

import br.edu.utfpr.pixescolinha.dto.TurmaRequestDTO;
import br.edu.utfpr.pixescolinha.dto.TurmaResponseDTO;
import br.edu.utfpr.pixescolinha.service.TurmaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/turmas")
@RequiredArgsConstructor
public class TurmaController {

    private final TurmaService turmaService;

    @PostMapping
    public ResponseEntity<TurmaResponseDTO> criar(@RequestBody @Valid TurmaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(turmaService.criar(dto));
    }

    @GetMapping
    public ResponseEntity<List<TurmaResponseDTO>> listarTodas() {
        return ResponseEntity.ok(turmaService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TurmaResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(turmaService.buscarPorId(id));
    }
}