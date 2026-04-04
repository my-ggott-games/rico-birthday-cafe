package com.rico.birthdaycafe.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}") // 1 day in ms
    private long validityInMilliseconds;

    @Value("${jwt.uid-issue-expiration-ms:300000}") // 5 minutes in ms
    private long uidIssueValidityInMilliseconds;

    private static final String UID_ISSUE_TOKEN_TYPE = "UID_ISSUE";
    private static final String TOKEN_TYPE_CLAIM = "tokenType";

    private SecretKey key;
    private final UserDetailsService userDetailsService;

    public JwtTokenProvider(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @PostConstruct
    protected void init() {
        this.key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String createToken(String username) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(validity)
                .signWith(key)
                .compact();
    }

    public String createUidIssueToken(String uid) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + uidIssueValidityInMilliseconds);

        return Jwts.builder()
                .subject(uid)
                .claim(TOKEN_TYPE_CLAIM, UID_ISSUE_TOKEN_TYPE)
                .issuedAt(now)
                .expiration(validity)
                .signWith(key)
                .compact();
    }

    public boolean validateUidIssueToken(String uid, String token) {
        try {
            Claims claims = parseClaims(token);
            String subject = claims.getSubject();
            String tokenType = claims.get(TOKEN_TYPE_CLAIM, String.class);
            return uid != null
                    && uid.equals(subject)
                    && UID_ISSUE_TOKEN_TYPE.equals(tokenType);
        } catch (Exception e) {
            return false;
        }
    }

    public Authentication getAuthentication(String token) {
        UserDetails userDetails = this.userDetailsService.loadUserByUsername(getUsername(token));
        return new UsernamePasswordAuthenticationToken(userDetails, "", userDetails.getAuthorities());
    }

    public String getUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
