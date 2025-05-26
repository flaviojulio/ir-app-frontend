# Importações existentes
from fastapi import FastAPI, UploadFile, File, HTTPException, Path, Body, Depends, status
from fastapi.middleware.cors import CORSMiddleware
import json
from typing import List, Dict, Any
import uvicorn

from auth import TokenExpiredError, InvalidTokenError, TokenNotFoundError, TokenRevokedError

# Novas importações para autenticação
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models import (
    UsuarioCreate, UsuarioUpdate, UsuarioResponse, LoginRequest, 
    LoginResponse, FuncaoCreate, FuncaoResponse, TokenResponse,
    OperacaoCreate, Operacao, ResultadoMensal, CarteiraAtual, 
    DARF, AtualizacaoCarteira, OperacaoFechada,
    # Modelos de autenticação
)
import auth

from database import (
    criar_tabelas, 
    limpar_banco_dados, 
)

import services
from services import (
    calcular_operacoes_fechadas,
    processar_operacoes,
    calcular_resultados_mensais,
    calcular_carteira_atual,
    gerar_darfs,
    inserir_operacao_manual,
    atualizar_item_carteira,
    listar_operacoes_service,
    deletar_operacao_service
)

# Inicialização do banco de dados
criar_tabelas()
auth.inicializar_autenticacao()

app = FastAPI(
    title="API de Acompanhamento de Carteiras de Ações e IR",
    description="API para upload de operações de ações e cálculo de imposto de renda",
    version="1.0.0"
)

# Configuração de CORS para permitir requisições de origens diferentes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração do OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Função para obter o usuário atual
async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    try:
        payload = auth.verificar_token(token)
    except TokenExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "O token de autenticação expirou.", "error_code": "TOKEN_EXPIRED"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": f"O token de autenticação é inválido ou malformado: {str(e)}", "error_code": "TOKEN_INVALID"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except TokenNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "O token de autenticação não foi reconhecido.", "error_code": "TOKEN_NOT_FOUND"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except TokenRevokedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "O token de autenticação foi revogado (ex: logout ou alteração de senha).", "error_code": "TOKEN_REVOKED"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail={"message": f"Erro inesperado durante a verificação do token: {str(e)}", "error_code": "UNEXPECTED_TOKEN_VERIFICATION_ERROR"},
        )

    sub_str = payload.get("sub")
    if not sub_str: 
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail={"message": "Token inválido: ID de usuário (sub) ausente no payload.", "error_code": "TOKEN_PAYLOAD_MISSING_SUB"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        usuario_id = int(sub_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail={"message": "Token inválido: ID de usuário (sub) não é um inteiro válido.", "error_code": "TOKEN_PAYLOAD_INVALID_SUB_FORMAT"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario_data = auth.obter_usuario(usuario_id) 
    if not usuario_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Usuário associado ao token não encontrado.", "error_code": "USER_FOR_TOKEN_NOT_FOUND"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return usuario_data

# Função para verificar se o usuário é administrador
async def get_admin_user(usuario: Dict = Depends(get_current_user)) -> Dict:
    if "admin" not in usuario.get("funcoes", []):
        raise HTTPException(
            status_code=403,
            detail="Acesso negado. Permissão de administrador necessária.",
        )
    return usuario

# Endpoints de autenticação
@app.post("/api/auth/registrar", response_model=UsuarioResponse)
async def registrar_usuario(usuario: UsuarioCreate):
    """
    Registra um novo usuário no sistema.
    """
    try:
        usuario_id = auth.criar_usuario(
            username=usuario.username,
            email=usuario.email,
            senha=usuario.senha,
            nome_completo=usuario.nome_completo
        )
        
        return auth.obter_usuario(usuario_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao registrar usuário: {str(e)}")

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = auth.verificar_credenciais(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")
    token = auth.gerar_token(user["id"])
    return {"access_token": token, "token_type": "bearer"}

@app.post("/api/auth/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    """
    Encerra a sessão do usuário revogando o token.
    """
    success = auth.revogar_token(token)
    
    if not success:
        raise HTTPException(status_code=400, detail="Erro ao encerrar sessão")
    
    return {"mensagem": "Sessão encerrada com sucesso"}

@app.get("/api/auth/me", response_model=UsuarioResponse)
async def get_me(usuario: Dict = Depends(get_current_user)):
    """
    Retorna os dados do usuário autenticado.
    """
    return usuario

# Endpoints de administração de usuários (apenas para administradores)
@app.get("/api/usuarios", response_model=List[UsuarioResponse])
async def listar_usuarios(admin: Dict = Depends(get_admin_user)):
    """
    Lista todos os usuários do sistema.
    Requer permissão de administrador.
    """
    return auth.obter_todos_usuarios()

@app.get("/api/usuarios/{usuario_id}", response_model=UsuarioResponse)
async def obter_usuario_por_id(
    usuario_id: int = Path(..., description="ID do usuário"),
    admin: Dict = Depends(get_admin_user)
):
    """
    Obtém os dados de um usuário pelo ID.
    Requer permissão de administrador.
    """
    usuario = auth.obter_usuario(usuario_id)
    
    if not usuario:
        raise HTTPException(status_code=404, detail=f"Usuário {usuario_id} não encontrado")
    
    return usuario

@app.put("/api/usuarios/{usuario_id}", response_model=UsuarioResponse)
async def atualizar_usuario_por_id(
    usuario_data: UsuarioUpdate,
    usuario_id: int = Path(..., description="ID do usuário"),
    admin: Dict = Depends(get_admin_user)
):
    """
    Atualiza os dados de um usuário.
    Requer permissão de administrador.
    """
    try:
        success = auth.atualizar_usuario(usuario_id, usuario_data.model_dump(exclude_unset=True))
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Usuário {usuario_id} não encontrado")
        
        return auth.obter_usuario(usuario_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar usuário: {str(e)}")

@app.delete("/api/usuarios/{usuario_id}")
async def excluir_usuario(
    usuario_id: int = Path(..., description="ID do usuário"),
    admin: Dict = Depends(get_admin_user)
):
    """
    Exclui um usuário do sistema.
    Requer permissão de administrador.
    """
    success = auth.excluir_usuario(usuario_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Usuário {usuario_id} não encontrado")
    
    return {"mensagem": f"Usuário {usuario_id} excluído com sucesso"}

@app.post("/api/usuarios/{usuario_id}/funcoes/{funcao_nome}")
async def adicionar_funcao_a_usuario(
    usuario_id: int = Path(..., description="ID do usuário"),
    funcao_nome: str = Path(..., description="Nome da função"),
    admin: Dict = Depends(get_admin_user)
):
    """
    Adiciona uma função a um usuário.
    Requer permissão de administrador.
    """
    success = auth.adicionar_funcao_usuario(usuario_id, funcao_nome)
    
    if not success:
        raise HTTPException(status_code=404, detail="Usuário ou função não encontrados")
    
    return {"mensagem": f"Função {funcao_nome} adicionada ao usuário {usuario_id}"}

@app.delete("/api/usuarios/{usuario_id}/funcoes/{funcao_nome}")
async def remover_funcao_de_usuario(
    usuario_id: int = Path(..., description="ID do usuário"),
    funcao_nome: str = Path(..., description="Nome da função"),
    admin: Dict = Depends(get_admin_user)
):
    """
    Remove uma função de um usuário.
    Requer permissão de administrador.
    """
    success = auth.remover_funcao_usuario(usuario_id, funcao_nome)
    
    if not success:
        raise HTTPException(status_code=404, detail="Usuário ou função não encontrados")
    
    return {"mensagem": f"Função {funcao_nome} removida do usuário {usuario_id}"}

# Endpoints para gerenciar funções
@app.get("/api/funcoes", response_model=List[FuncaoResponse])
async def listar_funcoes(admin: Dict = Depends(get_admin_user)):
    """
    Lista todas as funções do sistema.
    Requer permissão de administrador.
    """
    return auth.obter_todas_funcoes()

@app.post("/api/funcoes", response_model=FuncaoResponse)
async def criar_nova_funcao(
    funcao: FuncaoCreate,
    admin: Dict = Depends(get_admin_user)
):
    """
    Cria uma nova função no sistema.
    Requer permissão de administrador.
    """
    try:
        funcao_id = auth.criar_funcao(funcao.nome, funcao.descricao)
        
        # Obtém a função criada
        with auth.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id, nome, descricao FROM funcoes WHERE id = ?', (funcao_id,))
            return dict(cursor.fetchone())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar função: {str(e)}")

# Modificar os endpoints existentes para usar autenticação
# Por exemplo:

@app.get("/api/operacoes", response_model=List[Operacao])
async def listar_operacoes(usuario: Dict[str, Any] = Depends(get_current_user)):
    try:
        operacoes = listar_operacoes_service(usuario_id=usuario["id"])
        return operacoes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar operações: {str(e)}")

# Endpoints de operações com autenticação
@app.post("/api/upload", response_model=Dict[str, str])
async def upload_operacoes(
    file: UploadFile = File(...),
    usuario: Dict = Depends(get_current_user)
):
    """
    Endpoint para upload de arquivo JSON com operações de compra e venda de ações.
    """
    try:
        # Verificar se é um arquivo JSON
        if not file.filename.endswith('.json'):
            raise HTTPException(status_code=400, detail="Apenas arquivos JSON são aceitos")
        
        conteudo = await file.read()
        
        # Decodificar o conteúdo como string primeiro
        conteudo_str = conteudo.decode('utf-8')
        
        # Parse do JSON
        operacoes_json = json.loads(conteudo_str)
        
        # Validar se é uma lista
        if not isinstance(operacoes_json, list):
            raise HTTPException(status_code=400, detail="O arquivo JSON deve conter uma lista de operações")
        
        # Validar e converter cada operação
        operacoes = []
        for i, op_data in enumerate(operacoes_json):
            try:
                # Validar campos obrigatórios
                required_fields = ['date', 'ticker', 'operation', 'quantity', 'price', 'fees']
                for field in required_fields:
                    if field not in op_data:
                        raise ValueError(f"Campo obrigatório '{field}' ausente")
                
                # Validar tipos
                if not isinstance(op_data['quantity'], (int, float)) or op_data['quantity'] <= 0:
                    raise ValueError("Quantidade deve ser um número positivo")
                
                if not isinstance(op_data['price'], (int, float)) or op_data['price'] <= 0:
                    raise ValueError("Preço deve ser um número positivo")
                
                if not isinstance(op_data['fees'], (int, float)) or op_data['fees'] < 0:
                    raise ValueError("Taxas devem ser um número não negativo")
                
                if op_data['operation'] not in ['buy', 'sell']:
                    raise ValueError("Operação deve ser 'buy' ou 'sell'")
                
                # Criar objeto OperacaoCreate
                operacao = OperacaoCreate(**op_data)
                operacoes.append(operacao)
                
            except Exception as e:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Erro na operação {i+1}: {str(e)}"
                )
        
        # Processar as operações
        processar_operacoes(operacoes, usuario_id=usuario["id"])
        
        return {"mensagem": f"Arquivo processado com sucesso. {len(operacoes)} operações importadas."}
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Formato de arquivo JSON inválido: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar arquivo: {str(e)}")

@app.get("/api/resultados", response_model=List[ResultadoMensal])
async def obter_resultados(usuario: Dict = Depends(get_current_user)):
    """
    Retorna os resultados mensais de apuração de imposto de renda.
    """
    try:
        resultados = calcular_resultados_mensais(usuario_id=usuario["id"])
        return resultados
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular resultados: {str(e)}")

@app.get("/api/carteira", response_model=List[CarteiraAtual])
async def obter_carteira(usuario: Dict = Depends(get_current_user)):
    """
    Retorna a carteira atual de ações.
    """
    try:
        carteira = calcular_carteira_atual(usuario_id=usuario["id"])
        return carteira
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular carteira: {str(e)}")

@app.get("/api/darfs", response_model=List[DARF])
async def obter_darfs(usuario: Dict = Depends(get_current_user)):
    """
    Retorna os DARFs gerados para pagamento de imposto de renda.
    """
    try:
        darfs = gerar_darfs(usuario_id=usuario["id"])
        return darfs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar DARFs: {str(e)}")

@app.post("/api/operacoes", response_model=Dict[str, str])
async def criar_operacao(
    operacao: OperacaoCreate,
    usuario: Dict = Depends(get_current_user)
):
    """
    Cria uma nova operação manualmente.
    """
    try:
        inserir_operacao_manual(operacao, usuario_id=usuario["id"])
        return {"mensagem": "Operação criada com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar operação: {str(e)}")

@app.get("/api/operacoes/fechadas", response_model=List[OperacaoFechada])
async def obter_operacoes_fechadas(usuario: Dict = Depends(get_current_user)):
    """
    Retorna as operações fechadas (compra seguida de venda ou vice-versa).
    """
    try:
        operacoes_fechadas = calcular_operacoes_fechadas(usuario_id=usuario["id"])
        return operacoes_fechadas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular operações fechadas: {str(e)}")

@app.delete("/api/reset", response_model=Dict[str, str])
async def resetar_banco(admin: Dict = Depends(get_admin_user)):
    """
    Remove todos os dados do banco de dados.
    Requer permissão de administrador.
    """
    try:
        limpar_banco_dados()
        return {"mensagem": "Banco de dados limpo com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao limpar banco de dados: {str(e)}")

@app.delete("/api/operacoes/{operacao_id}", response_model=Dict[str, str])
async def deletar_operacao(
    operacao_id: int = Path(..., description="ID da operação"),
    usuario: Dict = Depends(get_current_user)
):
    """
    Remove uma operação pelo ID.
    """
    try:
        success = deletar_operacao_service(operacao_id=operacao_id, usuario_id=usuario["id"])
        if success:
            return {"mensagem": f"Operação {operacao_id} removida com sucesso."}
        else:
            raise HTTPException(status_code=404, detail=f"Operação {operacao_id} não encontrada ou não pertence ao usuário.")
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao remover operação: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
