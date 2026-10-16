package com.shopgila.backend.common;

import com.shopgila.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.util.MultiValueMap;
import tools.jackson.databind.json.JsonMapper;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Sql(scripts = "classpath:sql/utils/truncate_all_tables.sql")
public abstract class CommonIntegrationTests {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected JsonMapper objectMapper;

    @Autowired
    protected ProductRepository productRepository;

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

    protected ResultActions sendFile(String endpointRoute, byte[] content) throws Exception {
        return mockMvc.perform(multipart(endpointRoute)
                .file(new MockMultipartFile("file", "products.csv", "text/csv", content)));
    }
}
