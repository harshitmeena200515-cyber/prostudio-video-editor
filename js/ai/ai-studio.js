/**
 * ProStudio AI Studio Integration Module
 * Powered by AI Studio Neural Engine
 * Features: AI Scriptwriting, Auto Subtitle/Captions, Viral SEO & Creator Pro Tier
 */

export class ProStudioAI {
    constructor(app) {
        this.app = app;
        this.apiKey = localStorage.getItem('ai_studio_key') || localStorage.getItem('ai_api_key') || '';
        this.isPro = localStorage.getItem('prostudio_tier') === 'pro';
        this.init();
    }

    init() {
        this.injectUI();
        this.bindEvents();
        console.log("✨ ProStudio AI Studio initialized with Neural Engine");
    }

    injectUI() {
        // 1. Add AI Studio Tab to Left Panel
        const tabsContainer = document.querySelector('.panel-header .tabs');
        if (tabsContainer && !document.getElementById('tab-ai-studio')) {
            const aiTab = document.createElement('div');
            aiTab.id = 'tab-ai-studio';
            aiTab.className = 'tab';
            aiTab.dataset.target = 'ai-studio-lib';
            aiTab.style.color = '#c084fc';
            aiTab.style.fontWeight = '600';
            aiTab.innerHTML = '✨ AI Studio';
            tabsContainer.appendChild(aiTab);
        }

        // 2. Add AI Studio Tab Content
        const panelContent = document.querySelector('#panel-left .panel-content');
        if (panelContent && !document.getElementById('ai-studio-lib')) {
            const aiPane = document.createElement('div');
            aiPane.id = 'ai-studio-lib';
            aiPane.className = 'tab-pane';
            aiPane.style.padding = '12px';
            aiPane.style.overflowY = 'auto';
            aiPane.style.height = '100%';

            aiPane.innerHTML = `
                <div class="ai-tab-header" style="border-radius: 6px; margin-bottom: 12px;">
                    <div>
                        <div style="font-weight: 700; font-size: 13px; color: #fff; display: flex; align-items: center; gap: 6px;">
                            <span>✨ AI Studio Engine</span>
                            <span class="pro-badge" id="ai-license-badge">${this.isPro ? 'PRO ACTIVE' : 'FREE'}</span>
                        </div>
                        <div style="font-size: 11px; color: #a1a1aa;">Smart Script, Captions & SEO</div>
                    </div>
                    <button id="btn-open-ai-settings" class="ai-btn-secondary" title="Configure AI Studio Key">⚙️ Key</button>
                </div>

                <!-- 1. AI Video Scriptwriter -->
                <div class="ai-section-card">
                    <div class="ai-card-title">📝 AI Video Scriptwriter</div>
                    <input type="text" id="ai-script-topic" class="ai-input" placeholder="e.g. 5 Secret Travel Hacks for Budget Trips" />
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                        <select id="ai-script-platform" class="ai-select">
                            <option value="YouTube Shorts / Reels (60s)">Shorts / Reels (60s)</option>
                            <option value="YouTube Long Video (3-5 min)">YouTube Video (3-5 min)</option>
                            <option value="Commercial / Product Ad (30s)">Product Ad (30s)</option>
                            <option value="Educational Tutorial">Tutorial / Explainer</option>
                        </select>
                        <select id="ai-script-tone" class="ai-select">
                            <option value="Energetic & Viral">Energetic & Viral</option>
                            <option value="Professional & Informative">Professional</option>
                            <option value="Storytelling & Dramatic">Storytelling</option>
                            <option value="Humorous & Casual">Humorous</option>
                        </select>
                    </div>
                    <button id="btn-generate-script" class="ai-btn-primary">
                        <span>✨ Generate Scene Script</span>
                    </button>
                    <div id="ai-script-result" class="ai-output-box" style="display: none;"></div>
                    <div id="ai-script-actions" style="display: none; gap: 6px; margin-top: 8px;">
                        <button id="btn-copy-script" class="ai-btn-secondary" style="flex: 1;">📋 Copy</button>
                        <button id="btn-add-script-timeline" class="ai-btn-secondary" style="flex: 1; border-color: #8b5cf6; color: #c084fc;">➕ Timeline Text</button>
                    </div>
                </div>

                <!-- 2. Auto-Captions & Subtitle Generator -->
                <div class="ai-section-card">
                    <div class="ai-card-title">🎙️ AI Auto-Captions (.SRT)</div>
                    <textarea id="ai-caption-text" class="ai-textarea" rows="2" placeholder="Paste your voiceover script or dialog lines to convert into timed subtitles..."></textarea>
                    <button id="btn-generate-captions" class="ai-btn-primary" style="background: linear-gradient(135deg, #0284c7, #06b6d4);">
                        <span>⚡ Generate Subtitles</span>
                    </button>
                    <div id="ai-caption-result" class="ai-output-box" style="display: none;"></div>
                    <div id="ai-caption-actions" style="display: none; gap: 6px; margin-top: 8px;">
                        <button id="btn-download-srt" class="ai-btn-secondary" style="flex: 1;">💾 Download .SRT</button>
                    </div>
                </div>

                <!-- 3. AI Viral SEO & Metadata -->
                <div class="ai-section-card">
                    <div class="ai-card-title">🚀 Viral SEO & Title Generator</div>
                    <input type="text" id="ai-seo-input" class="ai-input" placeholder="Video summary or key theme..." />
                    <button id="btn-generate-seo" class="ai-btn-primary" style="background: linear-gradient(135deg, #10b981, #059669);">
                        <span>📈 Generate Viral Titles & Tags</span>
                    </button>
                    <div id="ai-seo-result" class="ai-output-box" style="display: none;"></div>
                </div>

                <!-- 4. Monetization & Creator Pro -->
                <div class="ai-section-card" style="background: linear-gradient(180deg, #1f1d2b, #16161a); border-color: #f59e0b55;">
                    <div class="ai-card-title" style="color: #fbbf24;">👑 Creator Pro Studio</div>
                    <p style="font-size: 11px; color: #d4d4d8; margin-bottom: 8px;">
                        ${this.isPro ? '🎉 All Pro features unlocked! 4K 60fps export & Watermark-free enabled.' : 'Unlock Watermark-free 4K Exports, Unlimited AI Scene Scripts & Cloud Assets.'}
                    </p>
                    ${!this.isPro ? `
                    <div style="display: flex; gap: 6px;">
                        <input type="text" id="pro-license-key" class="ai-input" style="margin-bottom: 0;" placeholder="Enter Pro Key (e.g. PROHARSHIT2026)" />
                        <button id="btn-activate-pro" class="ai-btn-primary" style="width: auto; background: #f59e0b; color: #000;">Unlock</button>
                    </div>
                    ` : `
                    <button id="btn-deactivate-pro" class="ai-btn-secondary" style="font-size: 10px;">Reset License</button>
                    `}
                </div>
            `;
            panelContent.appendChild(aiPane);
        }

        // 3. Add AI Quick Action Button to Header Menu
        const menuActions = document.querySelector('.menu-actions');
        if (menuActions && !document.getElementById('btn-header-ai')) {
            const aiHeaderBtn = document.createElement('button');
            aiHeaderBtn.id = 'btn-header-ai';
            aiHeaderBtn.className = 'ai-pill-btn';
            aiHeaderBtn.innerHTML = '<span>✨ AI Studio</span>';
            aiHeaderBtn.title = 'Open AI Studio';
            menuActions.insertBefore(aiHeaderBtn, menuActions.firstChild);
        }
    }

    bindEvents() {
        // Tab switching to AI Studio
        const aiTab = document.getElementById('tab-ai-studio');
        if (aiTab) {
            aiTab.addEventListener('click', () => {
                document.querySelectorAll('.panel-header .tab').forEach(t => t.classList.remove('active'));
                aiTab.classList.add('active');
                document.querySelectorAll('#panel-left .tab-pane').forEach(p => p.classList.remove('active'));
                const aiPane = document.getElementById('ai-studio-lib');
                if (aiPane) aiPane.classList.add('active');
            });
        }

        const headerAiBtn = document.getElementById('btn-header-ai');
        if (headerAiBtn) {
            headerAiBtn.addEventListener('click', () => {
                if (aiTab) aiTab.click();
            });
        }

        // API Key Settings Modal
        const btnSettings = document.getElementById('btn-open-ai-settings');
        if (btnSettings) {
            btnSettings.addEventListener('click', () => this.showSettingsModal());
        }

        // Script Generator
        const btnGenScript = document.getElementById('btn-generate-script');
        if (btnGenScript) {
            btnGenScript.addEventListener('click', () => this.generateScript());
        }

        // Copy Script
        const btnCopy = document.getElementById('btn-copy-script');
        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                const res = document.getElementById('ai-script-result');
                if (res) {
                    navigator.clipboard.writeText(res.innerText);
                    btnCopy.innerText = '✔️ Copied!';
                    setTimeout(() => btnCopy.innerText = '📋 Copy', 2000);
                }
            });
        }

        // Subtitle Generator
        const btnGenCaptions = document.getElementById('btn-generate-captions');
        if (btnGenCaptions) {
            btnGenCaptions.addEventListener('click', () => this.generateCaptions());
        }

        // Download SRT
        const btnDownloadSrt = document.getElementById('btn-download-srt');
        if (btnDownloadSrt) {
            btnDownloadSrt.addEventListener('click', () => {
                const srtText = document.getElementById('ai-caption-result')?.innerText;
                if (!srtText) return;
                const blob = new Blob([srtText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ProStudio_Captions_${Date.now()}.srt`;
                a.click();
            });
        }

        // SEO Generator
        const btnGenSeo = document.getElementById('btn-generate-seo');
        if (btnGenSeo) {
            btnGenSeo.addEventListener('click', () => this.generateSEO());
        }

        // Pro License Activation
        const btnActivate = document.getElementById('btn-activate-pro');
        if (btnActivate) {
            btnActivate.addEventListener('click', () => {
                const keyInput = document.getElementById('pro-license-key');
                const val = (keyInput?.value || '').trim();
                if (val.toUpperCase().includes('PRO') || val.length >= 8) {
                    localStorage.setItem('prostudio_tier', 'pro');
                    this.isPro = true;
                    alert('🎉 ProStudio Creator Pro Activated! Watermark removed & 4K Ultra HD Export Unlocked.');
                    location.reload();
                } else {
                    alert('Please enter a valid Pro License key (e.g. PROHARSHIT2026).');
                }
            });
        }

        const btnDeactivate = document.getElementById('btn-deactivate-pro');
        if (btnDeactivate) {
            btnDeactivate.addEventListener('click', () => {
                localStorage.removeItem('prostudio_tier');
                this.isPro = false;
                location.reload();
            });
        }

        // Intercept AI Tools Menu
        const aiToolsDropdown = document.querySelectorAll('.menu-nav .dropdown');
        aiToolsDropdown.forEach(dd => {
            if (dd.innerText.includes('AI Tools')) {
                dd.addEventListener('click', (e) => {
                    if (aiTab) aiTab.click();
                });
            }
        });
    }

    async callAIStudio(prompt, systemInstruction = '') {
        const apiKey = this.apiKey || localStorage.getItem('ai_studio_key') || localStorage.getItem('ai_api_key');
        if (!apiKey) {
            this.showSettingsModal();
            throw new Error("AI Studio API Key is missing. Please enter your API Key.");
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
        const body = {
            contents: [{ parts: [{ text: prompt }] }]
        };
        if (systemInstruction) {
            body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `HTTP ${res.status}: AI Studio API call failed`);
        }

        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    }

    async generateScript() {
        const topic = document.getElementById('ai-script-topic')?.value?.trim();
        const platform = document.getElementById('ai-script-platform')?.value;
        const tone = document.getElementById('ai-script-tone')?.value;
        const resultBox = document.getElementById('ai-script-result');
        const actionsBox = document.getElementById('ai-script-actions');
        const btn = document.getElementById('btn-generate-script');

        if (!topic) {
            alert('Please enter a video topic or concept!');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '⏳ Generating with AI Studio...';
        resultBox.style.display = 'block';
        resultBox.innerText = 'Creating cinematic scene breakdown, camera cues, and voiceover...';

        try {
            const prompt = `Write a viral, high-retention video script for:
Topic: "${topic}"
Target Format: ${platform}
Tone: ${tone}

Format the response strictly with:
1. 🎯 HOOK (0-3s): First visual frame + shock/curiosity opening voice line.
2. 🎬 SCENE BREAKDOWN (Scene 1 to Scene 4/5):
   - [Visual & Camera Direction]: What is shown on screen, camera movement, B-roll.
   - [Voiceover Narration]: Exact voice line to speak.
   - [On-Screen Graphic / Text Overlay]: Highlight words or stickers.
3. 🚀 CALL TO ACTION (CTA): Ending hook for likes/subs/shares.
Keep it snappy, engaging, and ready for production.`;

            const script = await this.callAIStudio(prompt, "You are an award-winning CapCut & Premiere Pro video director and scriptwriter.");
            resultBox.innerText = script;
            actionsBox.style.display = 'flex';
        } catch (err) {
            resultBox.innerText = `Error: ${err.message}`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>✨ Generate Scene Script</span>';
        }
    }

    async generateCaptions() {
        const text = document.getElementById('ai-caption-text')?.value?.trim();
        const resultBox = document.getElementById('ai-caption-result');
        const actionsBox = document.getElementById('ai-caption-actions');
        const btn = document.getElementById('btn-generate-captions');

        if (!text) {
            alert('Please paste speech/voiceover text to generate subtitles.');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '⏳ Formatting Timed Subtitles...';
        resultBox.style.display = 'block';
        resultBox.innerText = 'Calculating pacing and creating .SRT timestamps...';

        try {
            const prompt = `Convert the following narration text into standard SubRip (.SRT) subtitle file format with sequential numbers and realistic timestamps starting from 00:00:01,000:
Text:
"""${text}"""

Return ONLY valid .SRT syntax with timestamps like:
1
00:00:01,000 --> 00:00:03,500
Sample Subtitle text here

Do not include markdown code block backticks.`;

            const srtOutput = await this.callAIStudio(prompt, "You are a professional video subtitle and closed captions timing engine.");
            resultBox.innerText = srtOutput.replace(/```(srt)?/g, '').trim();
            actionsBox.style.display = 'flex';
        } catch (err) {
            resultBox.innerText = `Error: ${err.message}`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>⚡ Generate Subtitles</span>';
        }
    }

    async generateSEO() {
        const query = document.getElementById('ai-seo-input')?.value?.trim();
        const resultBox = document.getElementById('ai-seo-result');
        const btn = document.getElementById('btn-generate-seo');

        if (!query) {
            alert('Please enter a video topic or summary!');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '⏳ Researching Viral Tags...';
        resultBox.style.display = 'block';
        resultBox.innerText = 'Analyzing YouTube algorithm and hashtag volume...';

        try {
            const prompt = `For a video about: "${query}"
Generate:
1. 🔥 5 High-CTR YouTube / Reel Titles (Curiosity-driven, under 60 chars)
2. 🖼️ 3 Thumbnail Hook Texts (Bold 2-4 words)
3. 📝 SEO Description with Chapters/Timestamps outline
4. 🏷️ 15 High-ranking comma-separated Tags & Hashtags`;

            const seoData = await this.callAIStudio(prompt, "You are a top YouTube algorithm growth strategist.");
            resultBox.innerText = seoData;
        } catch (err) {
            resultBox.innerText = `Error: ${err.message}`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>📈 Generate Viral Titles & Tags</span>';
        }
    }

    showSettingsModal() {
        let modal = document.getElementById('ai-settings-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ai-settings-modal';
            modal.className = 'ai-modal-overlay';
            modal.innerHTML = `
                <div class="ai-modal-container">
                    <div class="ai-modal-header">
                        <div style="font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 8px;">
                            <span>✨ AI Studio Configuration</span>
                        </div>
                        <button class="ai-modal-close" id="btn-close-ai-modal">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        <p style="font-size: 12px; color: #a1a1aa; line-height: 1.6; margin-bottom: 14px;">
                            ProStudio connects directly to AI Studio's high-speed neural models. Your API key is stored locally in your browser's <code>localStorage</code> and is never shared or transmitted elsewhere.
                        </p>
                        
                        <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #e4e4e7;">
                            AI Studio API Key:
                        </label>
                        <input type="password" id="modal-ai-key" class="ai-input" style="font-family: monospace;" placeholder="AI Key..." value="${this.apiKey}" />
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #06b6d4; font-size: 11px; text-decoration: underline;">
                                ↗ Get API Key from AI Studio
                            </a>
                            <button id="btn-save-ai-key" class="ai-btn-primary" style="width: auto; padding: 8px 18px;">
                                Save Key
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('btn-close-ai-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });

            document.getElementById('btn-save-ai-key').addEventListener('click', () => {
                const val = (document.getElementById('modal-ai-key')?.value || '').trim();
                if (val) {
                    localStorage.setItem('ai_api_key', val);
                    this.apiKey = val;
                    alert('✅ AI Studio API Key saved locally!');
                    modal.style.display = 'none';
                } else {
                    alert('Please enter a valid API key.');
                }
            });
        }

        modal.style.display = 'flex';
        const keyInput = document.getElementById('modal-ai-key');
        if (keyInput) keyInput.value = this.apiKey;
    }
}
