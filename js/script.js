      // ─── Chat State ──────────────────────────────────────────────────────────────
      let chatOpen = false;
      let isLoading = false;
      const conversationHistory = [];

      // ─── System Prompt ───────────────────────────────────────────────────────────
      const JES_SYSTEM_PROMPT = `Você é o JES_AI, um assistente especialista no Portal JES (Jogos Escolares Superiores do IFPB). Você responde perguntas sobre o sistema de forma precisa, clara e com um leve tom temático de RPG/games, alinhado ao estilo da apresentação. Use emojis esporadicamente e termos como "aventureiro", "herói", etc. quando fizer sentido, mas sempre priorizando a clareza técnica.

SOBRE O PROJETO:
O Portal JES é uma aplicação web Django para gerenciar os Jogos Escolares Superiores do IFPB. O projeto também investiga a aplicação do método Privacy by Design (PbD) em IES, resolvendo a lacuna de 79,4% de falha na elicitação de requisitos de privacidade.

PROBLEMA CENTRAL:
- Processos manuais (papel, caneta, Google Forms) causam perda de dados, erros de elegibilidade e 90% mais tempo operacional
- Falta de integração com o ecossistema digital do IFPB
- 79,4% de falha na proteção de privacidade em IES

TECNOLOGIAS:
- Backend: Django 6.0.2 com Python 3.8+
- Banco de Dados: PostgreSQL via Supabase
- Autenticação: Django Auth + Backend Customizado (login por matrícula)
- Frontend: HTML5 + CSS3 (templates Django)
- Arquitetura: MVT (Model-View-Template) em 4 camadas: Apresentação → Aplicação → Negócio → Dados

STAKEHOLDERS:
- Clientes: Reitoria e Coordenação de Esportes do IFPB (dados estratégicos e conformidade legal)
- Usuários: Atletas (agilidade), Capitães (gestão da equipe), Moderadores (controle do evento)
- Ambiente: Instituição multicampi, solução Open Source sem custo de licenciamento

ENTIDADES PRINCIPAIS:
- Atlética: organização estudantil vinculada a campus/curso, gerenciada por um Capitão
- Atleta: estudante identificado por matrícula única, vinculado a uma atlética
- Modalidade: esporte (Futsal min5-max12, Vôlei min6-max12, Basquete min5-max12, Xadrez 1 atleta)
- Time: equipe de uma atlética em uma modalidade específica
- UserProfile: atleta com cargo administrativo (Admin/Moderador/Capitão)
- Associado: vínculo entre Atleta e UserProfile

HIERARQUIA DE CARGOS (RBAC):
Admin (Nível 3): acesso total, pode gerenciar tudo em qualquer atlética, dar cargos de Capitão e Moderador, remover qualquer cargo, ver estatísticas globais
Moderador (Nível 2): igual ao Admin, mas não pode remover cargos (apenas dar cargo de Capitão)
Capitão (Nível 1): acesso restrito à sua própria atlética - cadastrar atletas, criar/editar times, editar a própria atlética. Não pode dar/remover cargos nem excluir atléticas.

AUTENTICAÇÃO:
- Login por matrícula (não username) via MatriculaBackend customizado
- Senha padrão = matrícula (obrigatorio trocar no primeiro login)
- Senha forte: mínimo 8 chars, 1 maiúscula, 1 minúscula, 1 número, não pode ser senha comum
- Fluxo: matrícula+senha → verifica cargo → carrega atlética → se primeiro_login=True redireciona para troca de senha → dashboard

REGRAS DE NEGÓCIO PRINCIPAIS:
- RN-AUTH-01/02/03/04: login por matrícula, senha padrão=matrícula, primeiro login obrigatório trocar senha, validação forte
- RN-ATLETICA-01/02/03/04: criar (Admin/Mod/Capitão), editar (Admin/Mod qualquer; Capitão só a sua), excluir (só Admin/Mod, sem atletas nem times), Capitão responsável por UMA atlética
- RN-ATLETA-01/02/03: cadastrar (Admin/Mod qualquer; Capitão só na sua), editar nome/nasc/sexo, transferir (só Admin/Mod, atleta sem times ativos)
- RN-TIME-01/02/03/04: criar com atletas da mesma atlética respeitando min/max da modalidade, editar, excluir (confirmação obrigatória), regras por modalidade
- RN-PERM-01/02/03: dar cargo (Admin: Capitão+Moderador; Mod: Capitão), remover cargo (só Admin), atleta sem cargo perde acesso mas permanece no sistema

VALIDAÇÕES DE DADOS:
- Matrícula: 6-10 dígitos numéricos, única no sistema
- Email: formato válido RFC 5322, preferência @academico.ifpb.edu.br
- Data nascimento: não futura, idade 14-100 anos
- Nome atlética: único, 3-255 chars
- Nome time: único por modalidade+atlética, 3-100 chars

SEGURANÇA IMPLEMENTADA:
- CSRF protection em todos os formulários
- Django ORM (proteção SQL Injection)
- Auto-escaping nos templates (proteção XSS)
- PBKDF2 para hash de senhas (salt automático)
- Mensagens de erro genéricas no login (anti-brute force)
- Verificação de propriedade em todas as views
- Privacy by Design: dados minimizados e protegidos na arquitetura
- LGPD compliance: direito ao esquecimento via anonimização lógica
- HTTPS/TLS obrigatório em produção

MÓDULOS DO MVP:
A) Gestão de Identidade e Acesso (RBAC)
B) Módulo de Inscrição e Elegibilidade (validação SUAP, gestão de atléticas)
C) Operações Desportivas (súmulas flexíveis via JSONField, gestão de edições, conflito de instalações)

ROADMAP (Próximas funcionalidades):
- Gestão de Competições (criar competições, inscrever times, tabelas)
- Sistema de Pontuação (ranking de atléticas, histórico)
- Relatórios e Estatísticas (exportação PDF/Excel)
- Notificações (novas competições, lembretes)

BANCO DE DADOS (principais tabelas):
- atletica: id_atletica(PK), nome(UNIQUE), campus, id_curso, capitao_id(FK→usuario)
- atleta: matricula(PK), nome, data_nascimento, sexo, id_atletica(FK)
- usuario: id_usuario(PK), email(UNIQUE), password, cargo(Admin/Moderador/Capitao), primeiro_login, id_atletica(FK)
- associado: id_usuario(PK,FK), matricula_atleta(FK) — liga atleta ao seu UserProfile
- modalidade: id_modalidade(PK), nome, tipo(individual/dupla/equipe), min_atletas, max_atletas
- time: id_time(PK), nome, id_atletica(FK), id_modalidade(FK)
- time_atleta: id_time(FK,PK), matricula_atleta(FK,PK) — relacionamento N:N

Responda sempre em português brasileiro. Se não souber algo específico sobre o projeto que não esteja nas informações acima, diga honestamente que não tem essa informação disponível. Nunca invente dados sobre o projeto.`;

      // ─── Toggle Chat ─────────────────────────────────────────────────────────────
      function toggleChat() {
        chatOpen = !chatOpen;
        const win = document.getElementById("jes-chat-window");
        const icon = document.getElementById("chat-toggle-icon");
        if (chatOpen) {
          win.classList.remove("hidden");
          win.classList.add("flex", "flex-col");
          icon.textContent = "close";
          setTimeout(() => document.getElementById("jes-input").focus(), 100);
          scrollMessages();
        } else {
          win.classList.add("hidden");
          win.classList.remove("flex", "flex-col");
          icon.textContent = "smart_toy";
        }
      }

      // ─── Key Handler ─────────────────────────────────────────────────────────────
      function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      }

      // ─── Suggestion Shortcut ─────────────────────────────────────────────────────
      function sendSuggestion(text) {
        document.getElementById("jes-input").value = text;
        sendMessage();
      }

      // ─── Scroll to bottom ────────────────────────────────────────────────────────
      function scrollMessages() {
        const msgs = document.getElementById("jes-messages");
        setTimeout(() => (msgs.scrollTop = msgs.scrollHeight), 50);
      }

      // ─── Add Message to UI ───────────────────────────────────────────────────────
      function addMessage(role, content) {
        const msgs = document.getElementById("jes-messages");
        const isUser = role === "user";

        const wrapper = document.createElement("div");
        wrapper.className = isUser
          ? "flex gap-3 items-start flex-row-reverse"
          : "flex gap-3 items-start";

        const avatar = document.createElement("div");
        avatar.className = isUser
          ? "w-8 h-8 bg-secondary pixel-border shrink-0 flex items-center justify-center mt-1"
          : "w-8 h-8 bg-primary pixel-border shrink-0 flex items-center justify-center mt-1";
        avatar.innerHTML = isUser
          ? '<span class="material-symbols-outlined text-white text-sm" style="font-variation-settings: \'FILL\' 1;">person</span>'
          : '<span class="material-symbols-outlined text-white text-sm" style="font-variation-settings: \'FILL\' 1;">smart_toy</span>';

        const bubble = document.createElement("div");
        bubble.className = "flex-1";

        const label = document.createElement("div");
        label.className = isUser
          ? "font-pixel text-[8px] text-[#4dc1ff] mb-1 uppercase text-right"
          : "font-pixel text-[8px] text-[#FFE179] mb-1 uppercase";
        label.textContent = isUser ? "VOCÊ" : "JES_AI";

        const text = document.createElement("div");
        text.className = isUser
          ? "bg-secondary/20 border-2 border-secondary/40 p-3 text-sm text-white font-body leading-relaxed"
          : "bg-zinc-900 border-2 border-white/20 p-3 text-sm text-white font-body leading-relaxed";

        // Convert markdown-like formatting
        text.innerHTML = content
          .replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="text-[#84F280]">$1</strong>',
          )
          .replace(
            /`(.*?)`/g,
            '<code class="bg-zinc-700 px-1 text-[#FFE179] font-mono text-xs">$1</code>',
          )
          .replace(/\n/g, "<br>");

        bubble.appendChild(label);
        bubble.appendChild(text);
        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);
        msgs.appendChild(wrapper);
        scrollMessages();
      }

      // ─── Typing Indicator ────────────────────────────────────────────────────────
      function showTyping() {
        const msgs = document.getElementById("jes-messages");
        const el = document.createElement("div");
        el.id = "jes-typing";
        el.className = "flex gap-3 items-start";
        el.innerHTML = `
    <div class="w-8 h-8 bg-primary pixel-border shrink-0 flex items-center justify-center mt-1">
      <span class="material-symbols-outlined text-white text-sm" style="font-variation-settings: 'FILL' 1;">smart_toy</span>
    </div>
    <div class="bg-zinc-900 border-2 border-white/20 p-3 flex items-center gap-2">
      <div class="flex gap-1 items-center">
        <div class="w-2 h-2 bg-[#84F280] rounded-full animate-bounce" style="animation-delay:0ms"></div>
        <div class="w-2 h-2 bg-[#84F280] rounded-full animate-bounce" style="animation-delay:150ms"></div>
        <div class="w-2 h-2 bg-[#84F280] rounded-full animate-bounce" style="animation-delay:300ms"></div>
      </div>
      <span class="font-pixel text-[7px] text-white/40 uppercase">JES_AI está digitando...</span>
    </div>`;
        msgs.appendChild(el);
        scrollMessages();
      }

      function hideTyping() {
        const el = document.getElementById("jes-typing");
        if (el) el.remove();
      }

      // ─── Send Message ─────────────────────────────────────────────────────────────
      async function sendMessage() {
        if (isLoading) return;
        const input = document.getElementById("jes-input");
        const userText = input.value.trim();
        if (!userText) return;

        // Interface
        document.getElementById("jes-suggestions").style.display = "none";
        input.value = "";
        isLoading = true;
        document.getElementById("jes-send-btn").disabled = true;
        addMessage("user", userText);
        showTyping();

        try {
          const webAppUrl = (typeof CONFIG !== 'undefined') ? CONFIG.webAppUrl : "SUA_URL_AQUI";
          
          const response = await fetch(webAppUrl, {
            method: "POST",
            body: JSON.stringify({ message: userText }),
          });

          const data = await response.json();
          hideTyping();

          if (data.reply) {
            addMessage("assistant", data.reply);
          } else {
            addMessage(
              "assistant",
              "⚠️ Ocorreu um erro ao consultar a base de dados.",
            );
          }
        } catch (err) {
          hideTyping();
          addMessage("assistant", "⚠️ Falha na conexão com o cérebro da IA.");
        } finally {
          isLoading = false;
          document.getElementById("jes-send-btn").disabled = false;
          input.focus();
        }
      }

      let lastScroll = 0;
      window.addEventListener("scroll", () => {
        const winScroll =
          document.body.scrollTop || document.documentElement.scrollTop;
        const height =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;

        const progressBar = document.getElementById("yoshi-progress");
        const yoshiSprite = document.getElementById("yoshi-sprite");

        if (progressBar) {
          progressBar.style.width = scrolled + "%";
        }

        if (yoshiSprite) {
          if (winScroll > lastScroll) {
            yoshiSprite.querySelector("img").style.transform = "scaleX(1)";
          } else if (winScroll < lastScroll) {
            yoshiSprite.querySelector("img").style.transform = "scaleX(-1)";
          }

          if (Math.abs(winScroll - lastScroll) > 1) {
            yoshiSprite.classList.add("yoshi-walking");
          } else {
            yoshiSprite.classList.remove("yoshi-walking");
          }
        }
        lastScroll = winScroll;
      });

      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute("href"));
          if (target) {
            target.scrollIntoView({
              behavior: "smooth",
            });
          }
        });
      });
        
    
