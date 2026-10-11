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
            You are the official Civic AI Assistant for the EcoMind AI waste management platform and the Haritha Karma Sena doorstep collection service in Kerala.

            COMMUNICATION GUIDELINES (STANDARD & FORMAL):
            1. Maintain a professional, formal, polite, and standard civic tone at all times.
            2. Provide clear, well-structured, precise, and objective responses using formal business/academic language.
            3. Answer questions regarding doorstep collection schedules, verification codes, user fees, waste segregation policies, and environmental regulations authoritatively.
            4. If the user asks general or informational questions (such as science, technology, environment, or general inquiries), provide a structured, polite, and standard formal response.
            5. Structure information using clear headings, bullet points, and numbered lists where appropriate.
            """;

        public async Task<string> GetResponseAsync(string message)
        {
            var apiKey = _configuration["Gemini:ApiKey"]
                         ?? _configuration["GEMINI_API_KEY"]
                         ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            var configuredModel = _configuration["Gemini:Model"]
                                  ?? _configuration["GEMINI_MODEL"]
                                  ?? "gemini-1.5-flash";

            // If a valid Google Gemini API Key is configured (official keys start with AIzaSy)
            if (!string.IsNullOrWhiteSpace(apiKey) && apiKey.Trim().StartsWith("AIzaSy"))
            {
                var cleanKey = apiKey.Trim();
                var modelCandidates = new List<string>();
                if (!string.IsNullOrWhiteSpace(configuredModel))
                {
                    modelCandidates.Add(configuredModel);
                }
                if (!modelCandidates.Contains("gemini-1.5-flash"))
                    modelCandidates.Add("gemini-1.5-flash");
                if (!modelCandidates.Contains("gemini-2.0-flash"))
                    modelCandidates.Add("gemini-2.0-flash");
                if (!modelCandidates.Contains("gemini-1.5-pro"))
                    modelCandidates.Add("gemini-1.5-pro");
                if (!modelCandidates.Contains("gemini-2.5-flash"))
                    modelCandidates.Add("gemini-2.5-flash");

                _httpClient.DefaultRequestHeaders.Remove("x-goog-api-key");
                _httpClient.DefaultRequestHeaders.Add("x-goog-api-key", cleanKey);

                foreach (var model in modelCandidates)
                {
                    try
                    {
                        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={cleanKey}";

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
                                temperature = 0.2,
                                maxOutputTokens = 2500
                            }
                        };

                        var json = JsonSerializer.Serialize(requestBody);
                        using var content = new StringContent(json, Encoding.UTF8, "application/json");

                        var response = await _httpClient.PostAsync(url, content);
                        var responseJson = await response.Content.ReadAsStringAsync();

                        if (!response.IsSuccessStatusCode)
                        {
                            continue;
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
                    catch
                    {
                        // Fallback to internal formal knowledge engine
                    }
                }
            }

            // Standard Formal Conversational Intelligence Engine
            return GenerateSmartAssistantResponse(message);
        }

        private static string GenerateSmartAssistantResponse(string message)
        {
            if (message.Contains("[REAL-TIME CITIZEN PROFILE & LIVE ACCOUNT DATA]"))
            {
                return GenerateContextualAccountResponse(message);
            }

            return GenerateKnowledgeBaseResponse(message);
        }

        private static string GenerateContextualAccountResponse(string message)
        {
            try
            {
                var residentName = ExtractField(message, "Resident Name: ");
                var ward = ExtractField(message, "Ward: ");
                var requestStatus = ExtractField(message, "Request Status: ");
                var scheduledDate = ExtractField(message, "Scheduled Collection Date: ");
                var collectedDate = ExtractField(message, "Handover / Collected Date: ");
                var code = ExtractField(message, "4-Digit Pickup Verification Code: ");
                var senaTeam = ExtractField(message, "Assigned Haritha Karma Sena Team: ");
                var wasteCategory = ExtractField(message, "Waste Category: ");
                var duesTotal = ExtractField(message, "Total Outstanding Dues: ");

                var userQuery = "";
                var inquiryIdx = message.IndexOf("[CITIZEN INQUIRY]:", StringComparison.OrdinalIgnoreCase);
                if (inquiryIdx != -1)
                {
                    userQuery = message.Substring(inquiryIdx + "[CITIZEN INQUIRY]:".Length).Trim();
                }

                var q = userQuery.ToLowerInvariant();

                // Intent 1: Verification Code / OTP / PIN
                if (q.Contains("verification code") || q.Contains("pickup code") || q.Contains("my code") || q.Contains("otp") || q.Contains("pin") || (q.Contains("code") && !q.Contains("qr")))
                {
                    return $"### Official Verification Notice\n\n" +
                           $"Dear Citizen **{residentName}**,\n\n" +
                           $"Your registered **4-Digit Pickup Verification Code** is: **{code}**\n\n" +
                           $"**Service Record Details:**\n" +
                           $"* **Pickup Request Status:** {requestStatus}\n" +
                           $"* **Scheduled Collection Date:** {scheduledDate}\n" +
                           $"* **Assigned Field Personnel:** {senaTeam}\n\n" +
                           $"*Protocol:* Please provide this 4-digit code to the visiting Haritha Karma Sena personnel at the time of doorstep collection to authenticate and finalize the handover in the official portal.";
                }

                // Intent 2: Dues & Payment Status / Fees
                if (q.Contains("my fee") || q.Contains("my dues") || q.Contains("my bill") || q.Contains("how much do i owe") || q.Contains("outstanding dues") || q.Contains("pending dues") || q.Contains("pay my fee") || q.Contains("user fee"))
                {
                    return $"### Statement of Account & User Fee Status\n\n" +
                           $"Dear Citizen **{residentName}**,\n\n" +
                           $"Here is the official record of your monthly user fee status for **{ward}**:\n\n" +
                           $"* **Total Outstanding Dues:** **{duesTotal}**\n" +
                           $"* **Statutory Monthly Fee:** ₹50.00 (Doorstep non-biodegradable waste collection)\n\n" +
                           $"**Approved Payment Channels:**\n" +
                           $"1. **Digital / Online Payment:** Navigate to the **Monthly Payments** section on the portal to pay via UPI, Credit/Debit Card, or Net Banking.\n" +
                           $"2. **Direct Handover:** Remit the fee directly to the assigned Haritha Karma Sena personnel upon monthly collection and receive an immediate digital receipt.\n\n" +
                           $"*Notice:* Citizens maintaining a timely collection record may redeem 10 Eco-Points for a 20% concession (payable fee: ₹40.00).";
                }

                // Intent 3: Collection Schedule & Pickup Dates
                if (q.Contains("my schedule") || q.Contains("my pickup date") || q.Contains("when is my pickup") || q.Contains("collection date") || q.Contains("pickup schedule") || q.Contains("collection window") || q.Contains("pickup date"))
                {
                    return $"### Doorstep Collection Schedule\n\n" +
                           $"Dear Citizen **{residentName}**,\n\n" +
                           $"The scheduled waste collection details for your household are as follows:\n\n" +
                           $"* **Assigned Pickup Date:** **{scheduledDate}**\n" +
                           $"* **Official Ward Collection Window:** **15th to 25th of the current month**\n" +
                           $"* **Service Status:** {requestStatus}\n" +
                           $"* **Waste Category:** {wasteCategory}\n" +
                           $"* **Assigned Personnel:** {senaTeam}\n\n" +
                           $"*Instruction:* Please ensure all recyclable plastic items are thoroughly cleaned, dried, and stored in reusable gunny sacks prior to the designated pickup date.";
                }

                // Intent 4: Pickup Request Status & Updates
                if (q.Contains("request status") || q.Contains("pickup status") || q.Contains("track pickup") || q.Contains("request update") || q.Contains("my request") || q.Contains("pickup update"))
                {
                    return $"### Service Request Status Report\n\n" +
                           $"Dear Citizen **{residentName}**,\n\n" +
                           $"The current status of your waste collection service request is provided below:\n\n" +
                           $"* **Current Status:** **{requestStatus}**\n" +
                           $"* **Scheduled Date:** {scheduledDate}\n" +
                           $"* **Collection Timestamp:** {collectedDate}\n" +
                           $"* **Verification Code:** {code}\n" +
                           $"* **Material Category:** {wasteCategory}\n" +
                           $"* **Assigned Personnel:** {senaTeam}\n\n" +
                           $"For further assistance or schedule coordination, please contact the designated field personnel indicated above.";
                }

                // Intent 5: Worker / Team Contact
                if (q.Contains("my worker") || q.Contains("assigned worker") || q.Contains("who is collecting") || q.Contains("worker number") || q.Contains("worker phone") || q.Contains("contact worker"))
                {
                    return $"### Assigned Field Personnel Information\n\n" +
                           $"Dear Citizen **{residentName}**,\n\n" +
                           $"The authorized Haritha Karma Sena personnel assigned to **{ward}** are:\n\n" +
                           $"* **Personnel Name / Unit:** **{senaTeam}**\n" +
                           $"* **Scheduled Date of Visit:** {scheduledDate}\n" +
                           $"* **Verification Code Required:** {code}\n\n" +
                           $"Please ensure that non-biodegradable recyclable materials are prepared and ready for collection on the designated date.";
                }

                // Intent 6: Explicit account analysis request
                if (q.Contains("analyse my") || q.Contains("account summary") || q.Contains("my account") || q.Contains("profile summary") || string.IsNullOrWhiteSpace(userQuery))
                {
                    var sb = new StringBuilder();
                    sb.AppendLine($"### Citizen Account Summary & Status Report");
                    sb.AppendLine($"**Resident Name:** {residentName} | **Jurisdiction:** {ward}\n");

                    sb.AppendLine("#### 1. Doorstep Collection Status");
                    sb.AppendLine($"* **Service Status:** {requestStatus}");
                    sb.AppendLine($"* **Scheduled Date:** {scheduledDate} (Monthly window: 15th–25th)");
                    sb.AppendLine($"* **Handover Timestamp:** {collectedDate}");
                    sb.AppendLine($"* **4-Digit Verification Code:** {code}");
                    sb.AppendLine($"* **Assigned Personnel:** {senaTeam}");
                    sb.AppendLine();

                    sb.AppendLine("#### 2. Monthly User Fee Ledger");
                    sb.AppendLine($"* **Total Outstanding Balance:** {duesTotal}");
                    sb.AppendLine($"* **Payment Options:** Online via EcoMind Portal (UPI / Card / Net Banking) or Cash remittance directly to Haritha Karma Sena personnel.");
                    sb.AppendLine();

                    sb.AppendLine("#### 3. Standard Operational Guidelines");
                    sb.AppendLine($"* Ensure all recyclable plastic waste is cleaned, completely dry, and bagged in reusable gunny sacks.");
                    sb.AppendLine($"* Present the 4-digit verification code to field personnel upon completion of collection.");

                    return sb.ToString().Trim();
                }

                // If not an account query, evaluate standard formal knowledge response
                return GenerateKnowledgeBaseResponse(userQuery);
            }
            catch
            {
                return "Greetings. I am the official virtual assistant for EcoMind AI. Your profile and account records are active. Please state your query.";
            }
        }

        private static string GenerateKnowledgeBaseResponse(string query)
        {
            var q = query.ToLowerInvariant().Trim();

            // ==========================================
            // 1. STANDARD & FORMAL GREETINGS / CHIT-CHAT
            // ==========================================

            if (q.Contains("how are you") || q.Contains("how do you do") || q.Contains("how is your day") || q.Contains("how are things") || q.Contains("how's it going"))
            {
                return "Greetings. I am functioning optimally, thank you for inquiring.\n\n" +
                       "I am prepared to assist you with your waste management services, collection schedules, portal navigation, or any general informational queries. How may I be of service to you today?";
            }

            if (q.Contains("good morning"))
            {
                return "Good morning. Welcome to the EcoMind AI citizen portal. Please let me know how I may assist you today.";
            }
            if (q.Contains("good afternoon"))
            {
                return "Good afternoon. Welcome to the EcoMind AI citizen portal. How may I assist you with your civic services today?";
            }
            if (q.Contains("good evening"))
            {
                return "Good evening. Welcome to the EcoMind AI citizen portal. Please feel free to inquire regarding your collection schedule, fee ledger, or environmental guidelines.";
            }
            if (q.Contains("good night"))
            {
                return "Good night. Thank you for utilizing the EcoMind AI portal. Please reach out whenever you require service assistance.";
            }

            if (q == "hi" || q == "hello" || q == "hey" || q == "greetings" || q.Contains("help"))
            {
                return "Greetings. I am the official **Civic AI Assistant** for the **EcoMind AI** platform and **Haritha Karma Sena** services in Kerala.\n\n" +
                       "I am equipped to provide assistance with:\n" +
                       "1. **Collection Schedules & Assigned Dates** (Monthly window: 15th–25th)\n" +
                       "2. **Pickup Verification Code Validation**\n" +
                       "3. **Monthly User Fee Statements & Dues Status**\n" +
                       "4. **Solid Waste Segregation Protocols** (Plastics, packaging, hazardous domestic waste)\n" +
                       "5. **In-Situ Biodegradable Waste Composting Solutions**\n" +
                       "6. **General Civic and Scientific Inquiries**\n\n" +
                       "Please state your inquiry.";
            }

            if (q.Contains("thank you") || q.Contains("thanks") || q.Contains("appreciate"))
            {
                return "You are welcome. Should you require further assistance or clarification, please do not hesitate to ask.";
            }

            if (q == "bye" || q == "goodbye" || q.Contains("see you") || q.Contains("take care"))
            {
                return "Good day. Thank you for your commitment to responsible waste management and a cleaner environment.";
            }

            // Who are you / Identity
            if (q.Contains("who are you") || q.Contains("what is your name"))
            {
                return "I am the official automated **Civic AI Assistant** developed for the **EcoMind AI** platform.\n\n" +
                       "My purpose is to assist citizens and local self-governments across Kerala with reliable information on non-biodegradable waste collection, statutory regulations, doorstep pickup coordination, and general environmental queries.";
            }

            if (q.Contains("who made you") || q.Contains("who created you") || q.Contains("who developed you"))
            {
                return "I was designed and developed by the **EcoMind AI Development Team**.\n\n" +
                       "The system was engineered to digitize and enhance doorstep waste management workflows under the Haritha Karma Sena initiative, promoting zero-waste practices and transparency across local self-governments in Kerala.";
            }

            // Casual inquiries in formal tone (e.g. food, weather, joke)
            if (q.Contains("joke") || q.Contains("funny"))
            {
                return "Here is a lighthearted thought regarding sustainability:\n\n" +
                       "Why did the plastic bottle decide to visit the Material Collection Facility?\n" +
                       "Because it wanted to turn its life around and become something entirely new through recycling.\n\n" +
                       "Responsible recycling ensures that materials find valuable new purposes rather than polluting landfills.";
            }

            if (q.Contains("fun fact") || q.Contains("fact") || q.Contains("trivia"))
            {
                return "### Scientific Fact: Energy Conservation Through Recycling\n\n" +
                       "According to environmental lifecycle studies, manufacturing new products from recycled aluminum requires **95% less energy** compared to extracting and refining bauxite ore.\n\n" +
                       "Similarly, recycling plastic bottles consumes approximately **66% less energy** than producing virgin polymers from petroleum feedstocks, highlighting the critical importance of doorstep segregation.";
            }

            if (q.Contains("what is ai") || q.Contains("artificial intelligence") || q.Contains("machine learning"))
            {
                return "### Overview: Artificial Intelligence (AI)\n\n" +
                       "**Artificial Intelligence (AI)** refers to computerized systems designed to perform cognitive functions traditionally associated with human intelligence, including pattern recognition, natural language comprehension, and data synthesis.\n\n" +
                       "**Key Applications in Environmental Management:**\n" +
                       "• **Automated Waste Sorting:** Computer vision algorithms classify recyclables at Material Collection Facilities (MCFs).\n" +
                       "• **Logistics Optimization:** AI models generate efficient vehicle routing for doorstep collection fleets.\n" +
                       "• **Predictive Analytics:** Forecasting seasonal waste generation volumes across administrative wards.";
            }

            if (q.Contains("photosynthesis"))
            {
                return "### Scientific Definition: Photosynthesis\n\n" +
                       "**Photosynthesis** is the biological process by which autotrophic organisms, predominantly green plants and algae, synthesize chemical energy from light.\n\n" +
                       "**Biochemical Equation:**\n" +
                       "`6 CO₂ (Carbon Dioxide) + 6 H₂O (Water) + Light Energy ➔ C₆H₁₂O₆ (Glucose) + 6 O₂ (Oxygen)`\n\n" +
                       "This fundamental process serves as the primary source of organic matter and atmospheric oxygen sustaining terrestrial ecosystems.";
            }

            if (q.Contains("climate change") || q.Contains("global warming"))
            {
                return "### Environmental Briefing: Climate Change\n\n" +
                       "**Climate change** denotes significant, long-term alterations in global atmospheric conditions, primarily attributed to elevated concentrations of anthropogenic greenhouse gases (carbon dioxide, methane, nitrous oxide).\n\n" +
                       "**Regional Impacts in Kerala:**\n" +
                       "• Higher frequency of extreme meteorological events, including high-intensity localized precipitation and droughts.\n" +
                       "• Vulnerability of coastal and low-lying agricultural zones.\n\n" +
                       "**Mitigation Strategies:**\n" +
                       "• Complete avoidance of open waste combustion.\n" +
                       "• Decentralized composting of organic fractions to minimize methane generation.\n" +
                       "• Systematic circular recycling of polymers through Haritha Karma Sena networks.";
            }

            // Quick Math
            if (q.Contains("2+2") || q.Contains("2 + 2")) return "The mathematical result of 2 + 2 is **4**.";
            if (q.Contains("5+5") || q.Contains("5 + 5")) return "The mathematical result of 5 + 5 is **10**.";

            // ==========================================
            // 2. FORMAL WASTE & RECYCLING POLICIES
            // ==========================================

            // Plastic Segregation
            if (q.Contains("plastic") || q.Contains("pet") || q.Contains("hdpe") || q.Contains("pvc") || q.Contains("ldpe") || q.Contains("bottle") || q.Contains("cover") || q.Contains("bag") || q.Contains("wrapper") || q.Contains("milk"))
            {
                return "### Statutory Guideline: Non-Biodegradable Plastic Segregation\n\n" +
                       "Under the Kerala Solid Waste Management Bye-laws, citizens are mandated to segregate dry recyclable plastics for monthly handover to Haritha Karma Sena:\n\n" +
                       "1. **Polyethylene Terephthalate (PET / Code 1):** Beverage containers and mineral water bottles. Clean, desiccate, and compress.\n" +
                       "2. **High-Density Polyethylene (HDPE / Code 2):** Rigid containers for detergents, cosmetics, and household chemicals. Rinse thoroughly.\n" +
                       "3. **Low-Density Polyethylene (LDPE / Code 4):** Milk pouches, shopping covers, and packaging film. Wash thoroughly to eliminate biological residues.\n" +
                       "4. **Polypropylene (PP / Code 5):** Bottle closures, rigid food containers, and pharmaceutical caps.\n" +
                       "5. **Multi-Layer Packaging (MLP):** Clean laminated snack wrappers and packaging packets.\n\n" +
                       "*Mandatory Condition:* All plastics presented for collection must be completely **clean, dry, and devoid of organic contamination**.";
            }

            // Medicine Strips
            if (q.Contains("medicine") || q.Contains("tablet") || q.Contains("pill") || q.Contains("strip") || q.Contains("blister") || q.Contains("foil"))
            {
                return "### Policy Clarification: Pharmaceutical Blister Strips\n\n" +
                       "**Status:** **Approved for collection.**\n\n" +
                       "• Clean, emptied aluminum-plastic blister packaging and tablet foil strips are classified as recyclable dry waste under the Haritha Karma Sena collection protocol.\n" +
                       "• **Caution:** Ensure that no expired or residual pharmaceutical substances remain within the packaging prior to disposal.\n" +
                       "• Store emptied strips alongside dry plastics within your reusable collection sack.";
            }

            // Wet / Organic / Food Waste & Composting
            if (q.Contains("wet") || q.Contains("kitchen") || q.Contains("food") || q.Contains("organic") || q.Contains("compost") || q.Contains("biodegradable") || q.Contains("waste food") || q.Contains("vegetable"))
            {
                return "### Administrative Directive: Biodegradable Waste Management\n\n" +
                       "* **Service Boundary:** The Haritha Karma Sena is strictly designated for the collection of **dry, non-biodegradable waste**. Wet kitchen or organic waste is **not** accepted.\n" +
                       "* **Statutory Mandate:** In accordance with Suchitwa Mission regulations, households are required to manage biodegradable waste at source via approved in-situ mechanisms:\n" +
                       "  1. **Pipe Composting:** Decentralized dual PVC aerobic composting assemblies.\n" +
                       "  2. **Pot / Aerobic Composting Bins:** Inoculated aerobic bio-bins using microbial consortia.\n" +
                       "  3. **Biogas Plants:** Conversion of food residues into bio-methane for domestic cooking.\n" +
                       "  4. **Ring Composting:** Concrete ring aerobic degradation units.\n\n" +
                       "*Prohibition:* Co-mingling of biodegradable waste with dry recyclables is strictly prohibited.";
            }

            // Sanitary & Biomedical Waste
            if (q.Contains("sanitary") || q.Contains("diaper") || q.Contains("pad") || q.Contains("napkin") || q.Contains("medical") || q.Contains("syringe") || q.Contains("biomedical"))
            {
                return "### Protocol: Sanitary & Domestic Biomedical Waste Disposal\n\n" +
                       "1. **Preparation:** Used sanitary napkins, adult diapers, and baby diapers must be wrapped securely in multiple layers of newspaper.\n" +
                       "2. **Marking:** Clearly identify the wrapped parcel with a **Red Cross (➕)** symbol to ensure safe handling by municipal sanitation personnel.\n" +
                       "3. **Disposal Channel:** These items are diverted to authorized common biomedical waste treatment facilities (CBWTF, e.g., IMAGE) or designated high-temperature incinerators.\n" +
                       "4. **Strict Ban:** Do not dispose of sanitary waste into municipal plastic streams or public water bodies.";
            }

            // E-Waste
            if (q.Contains("e-waste") || q.Contains("ewaste") || q.Contains("battery") || q.Contains("bulb") || q.Contains("electronics") || q.Contains("cfl") || q.Contains("tube") || q.Contains("phone") || q.Contains("wire"))
            {
                return "### Protocol: Domestic Electronic & Hazardous Waste\n\n" +
                       "• **Items Included:** Defunct electronic peripherals, charging cables, batteries, compact fluorescent lamps (CFLs), and fluorescent tube lights.\n" +
                       "• **Channel:** The Local Self Government Department, in coordination with the Clean Kerala Company Limited, conducts **periodic scheduled collection campaigns** specifically for domestic e-waste.\n" +
                       "• **Safety Requirement:** Store intact lamps and battery cells safely to prevent breakage and heavy metal leakage until designated ward campaign dates are formally notified.";
            }

            // Glass, Footwear, Clothes
            if (q.Contains("glass") || q.Contains("footwear") || q.Contains("shoe") || q.Contains("chappal") || q.Contains("cloth") || q.Contains("fabric") || q.Contains("thermocol"))
            {
                return "### Non-Plastic Recyclable Materials Schedule\n\n" +
                       "• **Glass Bottles:** Diverted through quarterly glass collection drives designated by the Local Self Government.\n" +
                       "• **Discarded Footwear & Leather:** Collected through specialized annual collection calendars operated by Clean Kerala Company.\n" +
                       "• **Textile Waste:** Unusable shredded fabrics are channeled for industrial co-processing; wearable garments may be directed to local Swap Shops (തുണി മാറ്റിടം).\n" +
                       "• **Expanded Polystyrene (Thermocol):** Accepted in clean, dry condition during notified non-plastic drives.";
            }

            // Burning Plastic
            if (q.Contains("burn") || q.Contains("fire") || q.Contains("smoke") || q.Contains("burning"))
            {
                return "### Statutory Prohibition: Open Waste Combustion\n\n" +
                       "**Legal Status:** The open burning of solid and plastic waste is strictly prohibited under the Air (Prevention and Control of Pollution) Act, 1981, and the Solid Waste Management Rules, 2016.\n\n" +
                       "**Health Hazards:** Uncontrolled combustion of chlorinated polymers releases highly toxic, bioaccumulative compounds including **polychlorinated dibenzo-p-dioxins and furans**, contributing to respiratory morbidity and carcinogenic risks.\n\n" +
                       "**Penal Provisions:** Violations are subject to administrative penalties ranging from **₹10,000 to ₹25,000** imposed by local health and revenue authorities.";
            }

            // Fees
            if (q.Contains("fee") || q.Contains("50") || q.Contains("cost") || q.Contains("charge") || q.Contains("mandatory") || q.Contains("order") || q.Contains("rule") || q.Contains("law"))
            {
                return "### Statutory Provisions: Monthly User Fee\n\n" +
                       "• **Statutory Basis:** The levy of user fees is mandated by Government Order and affirmed by the Hon'ble High Court of Kerala to ensure the operational sustainability of decentralized waste management systems.\n" +
                       "• **Fee Structure:** ₹50.00 per month for residential households; ₹100.00+ for commercial entities.\n" +
                       "• **Livelihood Support:** The collected user fee directly supports the certified women entrepreneurs comprising the Haritha Karma Sena and funds Material Collection Facility (MCF) maintenance.\n" +
                       "• **Concession Program:** Timely collection adherence on the EcoMind portal yields Eco-Points, enabling citizens to redeem a 20% concession (net fee: ₹40.00).";
            }

            // ==========================================
            // 3. STANDARD FORMAL DEFAULT RESPONSE
            // ==========================================
            return $"### Inquiry Confirmation\n\n" +
                   $"Thank you for your inquiry regarding: **\"{query}\"**\n\n" +
                   $"As the automated virtual assistant for **EcoMind AI**, I am programmed to assist with doorstep waste collection, schedules, verification codes, and environmental regulations in Kerala.\n\n" +
                   $"**Standard Options:**\n" +
                   $"• Inquire regarding your **collection schedule** (e.g., *'What is my collection schedule?'*)\n" +
                   $"• Retrieve your **verification code** (e.g., *'What is my verification code?'*)\n" +
                   $"• Review your **monthly user fee dues** (e.g., *'What are my fee dues?'*)\n" +
                   $"• Access **waste segregation standards** (e.g., *'How to dispose of medicine strips?'*)\n\n" +
                   $"Please state your required service or topic for detailed assistance.";
        }

        private static string ExtractField(string text, string prefix)
        {
            var idx = text.IndexOf(prefix, StringComparison.OrdinalIgnoreCase);
            if (idx == -1) return "Not specified";

            var start = idx + prefix.Length;
            var end = text.IndexOfAny(new[] { '\r', '\n' }, start);
            var value = end == -1 ? text.Substring(start) : text.Substring(start, end - start);
            return value.Trim();
        }
    }
}