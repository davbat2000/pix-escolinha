package br.edu.utfpr.pixescolinha.config;

import br.edu.utfpr.pixescolinha.domain.model.Usuario;
import br.edu.utfpr.pixescolinha.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() == 0) {
            usuarioRepository.save(Usuario.builder()
                    .nome("Secretaria Admin")
                    .email("admin@pixescolinha.com")
                    .senha(passwordEncoder.encode("admin123"))
                    .build());
        }
    }
}