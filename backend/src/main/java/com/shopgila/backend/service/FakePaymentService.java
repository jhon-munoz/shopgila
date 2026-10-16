package com.shopgila.backend.service;

import com.shopgila.backend.dto.PaymentResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.UUID;

@Service
@Slf4j
public class FakePaymentService implements PaymentService {

    private static final String DECLINED_REASON = "card declined";

    private final String declineToken;

    public FakePaymentService(@Value("${shopgila.payment.decline-token:tok_declined}") String declineToken) {
        this.declineToken = declineToken;
    }

    @Override
    public PaymentResult charge(BigDecimal amount, String paymentToken) {
        if (declineToken.equals(paymentToken)) {
            log.info("Fake payment declined for amount {}", amount);
            return PaymentResult.declined(DECLINED_REASON);
        }
        String reference = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        log.info("Fake payment approved for amount {} with reference {}", amount, reference);
        return PaymentResult.approved(reference);
    }
}
