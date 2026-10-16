package com.shopgila.backend.common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.util.MultiValueMap;
import tools.jackson.databind.json.JsonMapper;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

public abstract class CommonControllerTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected JsonMapper objectMapper;

    protected ResultActions sendPostRequestWithBody(String endpointRoute, Object requestBody) throws Exception {
        return mockMvc.perform(post(endpointRoute)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)));
    }

    protected ResultActions sendPutRequestWithBody(String endpointRoute, Object requestBody) throws Exception {
        return mockMvc.perform(put(endpointRoute)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)));
    }

    protected ResultActions sendSimpleGetRequest(String endpointRoute) throws Exception {
        return mockMvc.perform(get(endpointRoute));
    }

    protected ResultActions sendGetRequestWithQueryParams(String endpointRoute, MultiValueMap<String, String> queryParams) throws Exception {
        return mockMvc.perform(get(endpointRoute).queryParams(queryParams));
    }

    protected ResultActions sendSimpleDeleteRequest(String endpointRoute) throws Exception {
        return mockMvc.perform(delete(endpointRoute));
    }
}
