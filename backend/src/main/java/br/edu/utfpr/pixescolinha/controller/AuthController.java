package br.edu.utfpr.pixescolinha.controller;

import br.edu.utfpr.pixescolinha.domain.model.Usuario;
import br.edu.utfpr.pixescolinha.security.TokenService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String senha) {}
    public record LoginResponse(String token, String nome, String email) {}

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest dto) {
        var authToken = new UsernamePasswordAuthenticationToken(dto.email(), dto.senha());
        var auth = authenticationManager.authenticate(authToken);
        var usuario = (Usuario) auth.getPrincipal();
        String jwt = tokenService.gerarToken(usuario);
        return ResponseEntity.ok(new LoginResponse(jwt, usuario.getNome(), usuario.getEmail()));
    }
}