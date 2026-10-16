package com.shopgila.backend.service;

import com.shopgila.backend.dto.PaymentResult;

import java.math.BigDecimal;

public interface PaymentService {

    PaymentResult charge(BigDecimal amount, String paymentToken);
}
