using System.Text;
using System.Text.Json;
using EcoMind.API.Interfaces;

namespace EcoMind.API.Services
{
    public class GeminiAIService : IAIService
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public GeminiAIService(
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _configuration = configuration;
            _httpClient = httpClient;
        }

        private const string EcoMindInstructions = """
            You are EcoMind AI, an AI assistant for the EcoMind waste
            management platform.

            Your main purpose is to help citizens with:
            - Waste disposal
            - Waste segregation
            - Recyclable plastic
            - Haritha Karma Sena collection
            - Plastic pickup requests
            - Collection schedules
            - Monthly payment information
            - EcoMind services

            ECO MIND RULES:

            1. EcoMind currently provides monthly recyclable plastic collection.

            2. Plastic collection is available between the 15th and 25th
               of every month.

            3. The exact collection date is selected by the assigned
               Haritha Karma Sena worker.

            4. Eligible plastic includes:
               - Plastic bottles
               - Plastic covers and wrappers
               - Medicine strips / tablet strips
               - Other recyclable plastic

            5. Glass, paper and cardboard are not part of the current
               monthly plastic pickup.

            6. Medicine strips/tablet strips are accepted as part of the
               current recyclable waste collection.

            7. Citizens should keep recyclable plastic clean and dry.

            8. Plastic should be stored in dry reusable gunny bags or sacks.

            9. Household users pay ₹50 per month.

            10. Commercial users pay ₹100 per month.

            11. Pickup requests and monthly payments are independent.

            12. Pickup completion requires the pickup verification code.

            RESPONSE RULES:

            - Be polite and helpful.
            - Use simple language.
            - Give practical answers.
            - Keep answers concise.
            - Give step-by-step instructions when useful.
            - Do not invent EcoMind policies.
            - Do not guess personal user information.
            - Do not invent pickup dates.
            - Do not invent payment status.
            - Do not claim that you changed database information.
            - Do not mark pickups as completed.

            SCOPE:

            Only answer questions related to EcoMind, waste disposal,
            recycling, waste segregation, HKS collection, pickup requests,
            pickup schedules and EcoMind payments.

            If the user asks an unrelated question, politely explain that
            the question is outside the scope of EcoMind AI.

            If the user asks for personal information such as their pickup
            date or payment status, do not guess. The application backend
            must provide the actual information.
            """;

        public async Task<string> GetResponseAsync(string message)
        {
            var apiKey = _configuration["Gemini:ApiKey"]
                         ?? _configuration["GEMINI_API_KEY"]
                         ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            var configuredModel = _configuration["Gemini:Model"]
                                  ?? _configuration["GEMINI_MODEL"]
                                  ?? "gemini-3.1-flash-lite";

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return GenerateLocalSummaryFallback(message) ??
                       "EcoMind AI is currently operating in offline mode. Please configure the Gemini API key.";
            }

            // Build candidate models list prioritizing configured model
            var modelCandidates = new List<string>();
            if (!string.IsNullOrWhiteSpace(configuredModel))
            {
                modelCandidates.Add(configuredModel);
            }
            if (!modelCandidates.Contains("gemini-3.1-flash-lite"))
            {
                modelCandidates.Add("gemini-3.1-flash-lite");
            }
            if (!modelCandidates.Contains("gemini-3.5-flash-lite"))
            {
                modelCandidates.Add("gemini-3.5-flash-lite");
            }
            if (!modelCandidates.Contains("gemini-3.6-flash"))
            {
                modelCandidates.Add("gemini-3.6-flash");
            }

            // Gemini API authentication
            _httpClient.DefaultRequestHeaders.Remove("x-goog-api-key");
            _httpClient.DefaultRequestHeaders.Add("x-goog-api-key", apiKey);

            Exception? lastException = null;

            foreach (var model in modelCandidates)
            {
                try
                {
                    var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";

                    var requestBody = new
                    {
                        system_instruction = new
                        {
                            parts = new[]
                            {
                                new { text = EcoMindInstructions }
                            }
                        },
                        contents = new[]
                        {
                            new
                            {
                                role = "user",
                                parts = new[]
                                {
                                    new { text = message }
                                }
                            }
                        },
                        generationConfig = new
                        {
                            temperature = 0.4,
                            maxOutputTokens = 2500
                        }
                    };

                    var json = JsonSerializer.Serialize(requestBody);
                    using var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await _httpClient.PostAsync(url, content);
                    var responseJson = await response.Content.ReadAsStringAsync();

                    if (!response.IsSuccessStatusCode)
                    {
                        lastException = new Exception($"Model '{model}' failed ({(int)response.StatusCode}): {responseJson}");
                        continue; // try next candidate model
                    }

                    using var document = JsonDocument.Parse(responseJson);

                    if (!document.RootElement.TryGetProperty("candidates", out var candidates) ||
                        candidates.GetArrayLength() == 0)
                    {
                        continue;
                    }

                    var candidate = candidates[0];
                    if (candidate.TryGetProperty("content", out var contentElem) &&
                        contentElem.TryGetProperty("parts", out var partsElem))
                    {
                        var sb = new StringBuilder();
                        foreach (var part in partsElem.EnumerateArray())
                        {
                            if (part.TryGetProperty("text", out var textElem))
                            {
                                var textStr = textElem.GetString();
                                if (!string.IsNullOrEmpty(textStr))
                                {
                                    sb.Append(textStr);
                                }
                            }
                        }

                        var resultText = sb.ToString();
                        if (!string.IsNullOrWhiteSpace(resultText))
                        {
                            return resultText.Trim();
                        }
                    }
                }
                catch (Exception ex)
                {
                    lastException = ex;
                }
            }

            // If all Gemini cloud models failed (e.g. rate limit, quota exhaustion),
            // gracefully generate an intelligent local structured summary from citizenContext
            var fallbackSummary = GenerateLocalSummaryFallback(message);
            if (!string.IsNullOrWhiteSpace(fallbackSummary))
            {
                return fallbackSummary;
            }

            throw lastException ?? new Exception("Unable to get response from EcoMind AI models.");
        }

        /// <summary>
        /// Context-aware fallback generator when external cloud AI quotas are temporarily exhausted.
        /// Extracts real-time profile, pickup schedule, verification code, and dues to guarantee
        /// complete summaries are always rendered without truncation.
        /// </summary>
        private static string? GenerateLocalSummaryFallback(string message)
        {
            if (!message.Contains("[REAL-TIME CITIZEN PROFILE & LIVE ACCOUNT DATA]"))
            {
                return null;
            }

            try
            {
                var residentName = ExtractField(message, "Resident Name: ");
                var household = ExtractField(message, "Household Residence: ");
                var requestStatus = ExtractField(message, "Request Status: ");
                var scheduledDate = ExtractField(message, "Scheduled Collection Date: ");
                var collectedDate = ExtractField(message, "Handover / Collected Date: ");
                var code = ExtractField(message, "4-Digit Pickup Verification Code: ");
                var senaTeam = ExtractField(message, "Assigned Haritha Karma Sena Team: ");
                var wasteCategory = ExtractField(message, "Waste Category: ");
                var duesTotal = ExtractField(message, "Total Outstanding Dues: ");

                var sb = new StringBuilder();
                sb.AppendLine($"Hello {residentName}! Here is the complete summary and analysis of your current schedule, pickup request updates, and dues:\n");
                
                sb.AppendLine("### 1. Live Pickup Request & Schedule Updates");
                sb.AppendLine($"* **Request Status:** {requestStatus}");
                sb.AppendLine($"* **Waste Category:** {wasteCategory}");
                sb.AppendLine($"* **Scheduled Collection Date:** {scheduledDate}");
                sb.AppendLine($"* **Collected / Handover Date:** {collectedDate}");
                sb.AppendLine($"* **4-Digit Verification Code:** {code}");
                sb.AppendLine($"* **Assigned Team:** {senaTeam}");
                sb.AppendLine();

                sb.AppendLine("### 2. Live Monthly User Fee & Payment Dues");
                sb.AppendLine($"* **Total Outstanding Dues:** {duesTotal}");
                sb.AppendLine("* **Payment Methods:** Online via EcoMind AI (UPI, Card, QR) or Cash to Haritha Karma Sena worker upon pickup with instant digital receipt.");
                sb.AppendLine();

                sb.AppendLine("### 3. Collection Rules & Instructions");
                sb.AppendLine("* Keep recyclable plastic clean, dry, and stored in reusable gunny bags or sacks.");
                sb.AppendLine("* Monthly recyclable plastic collection takes place between the 15th and 25th.");
                sb.AppendLine("* Ensure your 4-digit verification code is shared with the visiting Haritha Karma Sena worker to verify collection.");

                return sb.ToString().Trim();
            }
            catch
            {
                return null;
            }
        }

        private static string ExtractField(string text, string prefix)
        {
            var idx = text.IndexOf(prefix, StringComparison.OrdinalIgnoreCase);
            if (idx == -1) return "Not specified";

            var start = idx + prefix.Length;
            var end = text.IndexOf('\n', start);
            var value = end == -1 ? text.Substring(start) : text.Substring(start, end - start);
            return value.Trim();
        }
    }
}