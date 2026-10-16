package com.shopgila.backend.service;

import com.shopgila.backend.dto.PaymentResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class FakePaymentServiceTest {

    private final FakePaymentService service = new FakePaymentService("tok_declined");

    @Test
    @DisplayName("Should approve a regular token with a reference")
    void shouldApproveRegularToken() {
        PaymentResult result = service.charge(BigDecimal.TEN, "tok_visa");

        assertThat(result.approved()).isTrue();
        assertThat(result.reference()).startsWith("PAY-").hasSize(12);
        assertThat(result.failureReason()).isNull();
    }

    @Test
    @DisplayName("Should decline the configured token")
    void shouldDeclineConfiguredToken() {
        PaymentResult result = service.charge(BigDecimal.TEN, "tok_declined");

        assertThat(result.approved()).isFalse();
        assertThat(result.reference()).isNull();
        assertThat(result.failureReason()).isEqualTo("card declined");
    }

    @Test
    @DisplayName("Should generate a different reference for each payment")
    void shouldGenerateDifferentReferences() {
        String first = service.charge(BigDecimal.TEN, "tok_visa").reference();
        String second = service.charge(BigDecimal.TEN, "tok_visa").reference();

        assertThat(first).isNotEqualTo(second);
    }

    @Test
    @DisplayName("Should use the token configured for the decline")
    void shouldUseConfiguredDeclineToken() {
        FakePaymentService custom = new FakePaymentService("tok_nope");

        assertThat(custom.charge(BigDecimal.TEN, "tok_nope").approved()).isFalse();
        assertThat(custom.charge(BigDecimal.TEN, "tok_declined").approved()).isTrue();
    }
}
