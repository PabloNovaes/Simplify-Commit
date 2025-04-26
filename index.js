#!/usr/bin/env node

import { execSync } from "child_process";
import inquirer from "inquirer";
import ora from "ora";

const URL_REGEX = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)(\.git)?$/

async function askRemoteOrigin() {
    const { remoteOrigin } = await inquirer.prompt([
        {
            type: "input",
            name: "remoteOrigin",
            message: "Adicione a URL do seu repositório remoto:",
            validate: (input) => {
                if (URL_REGEX.test(input)) {
                    return true; // Aceita
                }
                return "Por favor, insira uma URL válida do GitHub (ex: https://github.com/usuario/repositorio.git)";
            }
        }
    ]);

    return remoteOrigin;
}

async function main() {
    try {

        let repoIsInitialized = true

        try {
            execSync("git status", { stdio: "pipe" });
        } catch (error) {
            console.log("🚨 Este projeto ainda não foi inicializado no Git, inicializando projeto...");
            execSync("git init", { stdio: "pipe" });
            repoIsInitialized = false
            console.log("")
        }
        console.log(repoIsInitialized);

        const { commitType, message } = await inquirer.prompt([
            {
                type: "list",
                name: "commitType",
                message: "Selecione o tipo de commit:",
                choices: [
                    { name: "first commit", value: "init" },
                    { name: "feat: Nova funcionalidade", value: "feat" },
                    { name: "fix: Correção de bug", value: "fix" },
                    { name: "docs: Alterações na documentação", value: "docs" },
                    { name: "style: Alterações no estilo (formatação, etc.)", value: "style" },
                    { name: "refactor: Refatoração de código", value: "refactor" },
                    { name: "perf: Alterações que melhoram a performance", value: "perf" },
                    { name: "test: Adição ou correção de testes", value: "test" },
                    { name: "chore: Tarefas de manutenção", value: "chore" }
                ]
            },
            {
                type: "input",
                name: "message",
                message: "Digite a mensagem do commit:",
                when: repoIsInitialized,
                validate: (input) => input ? true : "A mensagem do commit não pode estar vazia!"
            }
        ]);

        const commitMessage = commitType !== 'init' ? `${commitType}: ${message}` : commitType;

        console.log("\n🔄 Adicionando arquivos...");
        execSync("git add .", { stdio: "inherit" });

        console.log("📌 Fazendo commit...");
        execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });

        const url = await askRemoteOrigin();

        console.log("Adicionando repósitorio remoto...")
        execSync(`git remote add origin ${url}`, { stdio: "inherit" })

        console.log("Definindo a branch principal (main)...")
        execSync('git branch -M main', { stdio: "inherit" })

        const spinner = ora("🚀 Enviando para o repositório...").start();
        try {
            await new Promise((res) => setTimeout(() => res(''), 1000))

            if (repoIsInitialized) {
                execSync("git push", { stdio: "inherit" });
            } else {
                execSync("git push --set-upstream origin main", { stdio: "inherit" });
            }

            spinner.succeed("Push concluído com sucesso!");
        } catch (error) {
            spinner.fail("Erro ao enviar para o repositório.");
            console.error(error.message);
        }
    } catch (error) {
        if (error.isTtyError) {
            console.error("\n❌ Erro: O terminal não suporta interatividade.");
        } else if (error.message.includes("User force closed the prompt")) {
            console.log("\n🚪 Operação cancelada pelo usuário.");
        } else {
            console.error("\n❌ Erro inesperado:", error.message);
        }
        process.exit(1);
    }
}

main();
