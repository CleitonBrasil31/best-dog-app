import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, MapPin, User, CheckCircle, Utensils, Home,
  Plus, Trash2, X, Package, ClipboardList, Pencil, Settings, 
  Bike, MessageCircle, Map, DollarSign, Users, 
  ChefHat, TrendingUp, AlertCircle, Clock,
  Flame, UserPlus, Phone, Percent, Play, Calendar,
  Coffee, Star, ArrowRight, Edit3, CheckSquare, Square, Layers, Tag, Wand2,
  Moon, Sun, Image as ImageIcon, Loader2
} from 'lucide-react';

// --- IMPORTAÇÃO SUPABASE ---
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO SUPABASE (COLE SUAS CHAVES AQUI) ---
// Se não colar as chaves reais aqui, o sistema não salva!
const supabaseUrl = 'https://nkxumeebdwbdpdmajwdu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reHVtZWViZHdiZHBkbWFqd2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTA3MDEsImV4cCI6MjA3OTg2NjcwMX0.iPMYUJWQQzn--nEWBjf4_wHuFi7HZkZVXRlRpb94Tyw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Inicialização segura do cliente
const supabase = (supabaseUrl !== 'https://nkxumeebdwbdpdmajwdu.supabase.coE') 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- CONFIGURAÇÃO DE SOM ---
const SOM_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

// --- COMPONENTES VISUAIS ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-amber-100/80 dark:border-slate-700 overflow-hidden transition-colors duration-300 ${className}`}>{children}</div>
);

const Badge = ({ status }) => {
  const styles = {
    'Pendente': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    'Saiu para Entrega': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    'Concluido': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    'Cancelado': 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${styles[status] || styles['Pendente']} flex items-center gap-1 w-fit`}>
      {status === 'Saiu para Entrega' && <Bike size={10}/>}
      {status === 'Concluido' && <CheckCircle size={10}/>}
      {status ? status : 'UNK'}
    </span>
  );
};

// --- APP PRINCIPAL ---
function App() {
  const [abaAtiva, setAbaAtiva] = useState('dashboard'); 
  const [filtroCardapio, setFiltroCardapio] = useState('Lanches');
  const [modalPedidoAberto, setModalPedidoAberto] = useState(false);
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [modalMonteDogAberto, setModalMonteDogAberto] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- DADOS DO BANCO ---
  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [taxasFrete, setTaxasFrete] = useState([]);
  const [montagemItens, setMontagemItens] = useState([]); 

  // --- CONFIGURAÇÕES LOCAIS ---
  const [darkMode, setDarkMode] = useState(() => {
      const salvo = localStorage.getItem('bd_darkmode');
      return salvo ? JSON.parse(salvo) : false;
  });
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('bd_logo_url') || '');

  // --- UTILITÁRIOS ---
  const getDataHoje = () => new Date().toISOString().split('T')[0];
  const formatarMoeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const tocarSom = () => { try { const audio = document.getElementById('audio-alerta'); if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); } } catch(e){} };

  // EFEITOS VISUAIS
  useEffect(() => {
    localStorage.setItem('bd_darkmode', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);
  useEffect(() => { localStorage.setItem('bd_logo_url', logoUrl); }, [logoUrl]);

  // --- FETCH E REALTIME DO SUPABASE ---
  const fetchDados = async () => {
      if(!supabase) { setLoading(false); return; } // Modo offline/sem chave
      
      const { data: p } = await supabase.from('produtos').select('*');
      if(p) setProdutos(p);
      
      const { data: c } = await supabase.from('clientes').select('*');
      if(c) setClientes(c);

      const { data: t } = await supabase.from('taxas').select('*');
      if(t) setTaxasFrete(t);

      const { data: m } = await supabase.from('montagem_itens').select('*');
      if(m) setMontagemItens(m);

      const { data: ped } = await supabase.from('pedidos').select('*').order('id', { ascending: false });
      if(ped) setPedidos(ped);
      
      setLoading(false);
  };

  useEffect(() => {
      if(!supabase) return;
      fetchDados();

      const canal = supabase.channel('mudancas-gerais')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            fetchDados();
            if(payload.table === 'pedidos' && payload.eventType === 'INSERT') tocarSom();
        })
        .subscribe();

      return () => { supabase.removeChannel(canal); }
  }, []);

  // Config do Monte seu Dog (Derivado dos dados do banco)
  const configMontagem = useMemo(() => {
      return {
          paes: montagemItens.filter(i => i.categoria === 'paes'),
          queijos: montagemItens.filter(i => i.categoria === 'queijos'),
          salsichas: montagemItens.filter(i => i.categoria === 'salsichas'),
          molhos: montagemItens.filter(i => i.categoria === 'molhos'),
          adicionais: montagemItens.filter(i => i.categoria === 'adicionais'),
      }
  }, [montagemItens]);

  // --- FILTROS ---
  const [filtroData, setFiltroData] = useState(getDataHoje());
  const [novaTaxa, setNovaTaxa] = useState({ nome: '', valor: '' });
  const [novoItemMontagem, setNovoItemMontagem] = useState({ categoria: 'paes', nome: '', valor: '' });

  // --- FORMULÁRIOS ---
  const getFormPedidoInicial = () => ({ 
      id: null, nome: '', endereco: '', telefone: '', taxaEntrega: 0, pagamento: 'Dinheiro', trocoPara: '', observacoes: '', desconto: 0, 
      itens: [{ produtoId: '', nome: '', qtd: 1, preco: 0, opcoesSelecionadas: [], listaAdicionais: [] }] 
  });

  const [formPedido, setFormPedido] = useState(getFormPedidoInicial());
  const formProdutoInicial = { nome: '', descricao: '', preco: '', estoque: '', opcoes: '', tipo: 'principal', categoria: 'Lanches' };
  const [formProduto, setFormProduto] = useState(formProdutoInicial);
  const formClienteInicial = { nome: '', telefone: '', endereco: '', obs: '' };
  const [formCliente, setFormCliente] = useState(formClienteInicial);
  const [montagem, setMontagem] = useState({ paoId: '', salsichaId: '', queijoIds: [], molhoIds: [], adicionalIds: [] });

  // --- LÓGICA CRUD (SUPABASE) ---
  
  const salvarProduto = async (e) => {
    e.preventDefault();
    if(!supabase) return alert("Configure as chaves do Supabase no código!");
    let tipo = formProduto.categoria === 'Adicionais' ? 'adicional' : 'principal';
    const dados = { 
        nome: formProduto.nome, 
        descricao: formProduto.descricao,
        preco: parseFloat(formProduto.preco||0), 
        estoque: parseInt(formProduto.estoque||0), 
        tipo, 
        categoria: formProduto.categoria,
        opcoes: formProduto.opcoes 
    };
    if(formProduto.id) await supabase.from('produtos').update(dados).eq('id', formProduto.id);
    else await supabase.from('produtos').insert([dados]);
    setModalProdutoAberto(false);
  };
  const excluirProduto = async (id) => { if(confirm("Excluir?")) await supabase.from('produtos').delete().eq('id', id); };

  const salvarCliente = async (e) => {
    e.preventDefault();
    if(!supabase) return alert("Configure as chaves do Supabase!");
    const dados = { nome: formCliente.nome, telefone: formCliente.telefone, endereco: formCliente.endereco, obs: formCliente.obs };
    if(formCliente.id) await supabase.from('clientes').update(dados).eq('id', formCliente.id);
    else await supabase.from('clientes').insert([dados]);
    setModalClienteAberto(false);
  };
  const excluirCliente = async (id) => { if(confirm("Apagar?")) await supabase.from('clientes').delete().eq('id', id); };

  const salvarTaxa = async (e) => { 
      e.preventDefault(); 
      if (!novaTaxa.nome || !novaTaxa.valor) return; 
      if(!supabase) return;
      await supabase.from('taxas').insert([{ nome: novaTaxa.nome, valor: parseFloat(novaTaxa.valor) }]);
      setNovaTaxa({ nome: '', valor: '' }); 
  };
  const excluirTaxa = async (id) => { if(confirm("Remover?")) await supabase.from('taxas').delete().eq('id', id); };

  const adicionarItemConfig = async () => { 
      if (!novoItemMontagem.nome) return; 
      if(!supabase) return;
      await supabase.from('montagem_itens').insert([{ 
          categoria: novoItemMontagem.categoria, 
          nome: novoItemMontagem.nome, 
          valor: parseFloat(novoItemMontagem.valor || 0) 
      }]);
      setNovoItemMontagem({ ...novoItemMontagem, nome: '', valor: '' }); 
  };
  const removerItemConfig = async (id) => { await supabase.from('montagem_itens').delete().eq('id', id); };

  // --- CÁLCULOS ---
  const extrairValorOpcao = (txt) => { if (!txt || !txt.includes('=+')) return 0; return parseFloat(txt.split('=+')[1]) || 0; };
  const extrairNomeOpcao = (txt) => { if (!txt) return ''; return txt.split('=+')[0].trim(); };
  
  const calcularSubtotalItens = (itens) => { 
    if(!itens || !Array.isArray(itens)) return 0; 
    return itens.reduce((acc, item) => { 
      if(!item.produtoId) return acc;
      const pBase = Number(item.preco || 0); 
      const pOpcoes = (item.opcoesSelecionadas || []).reduce((s, op) => s + extrairValorOpcao(op), 0);
      const pAdics = item.listaAdicionais ? item.listaAdicionais.reduce((sum, adId) => { const p = produtos.find(x => x.id === adId); return sum + (p ? Number(p.preco) : 0); }, 0) : 0; 
      return acc + ((pBase + pOpcoes + pAdics) * Number(item.qtd || 1)); 
    }, 0); 
  };
  const calcularTotalPedido = (itens, entrega, descontoPorcentagem) => { 
      const subtotal = calcularSubtotalItens(itens); 
      const valorDesconto = subtotal * ((descontoPorcentagem || 0) / 100); 
      return (subtotal - valorDesconto) + Number(entrega || 0); 
  };

  // --- MONTAGEM ---
  const toggleMultiplo = (campo, id) => { const lista = montagem[campo]; setMontagem({ ...montagem, [campo]: lista.includes(id) ? lista.filter(i => i !== id) : [...lista, id] }); };
  
  const concluirMontagem = () => {
      const pao = configMontagem.paes.find(p => p.id == montagem.paoId) || {nome: 'Pão Padrão', valor: 0};
      const salsicha = configMontagem.salsichas.find(s => s.id == montagem.salsichaId) || {nome: 'Tradicional', valor: 0};
      let totalExtras = 0;
      let detalhes = [];
      
      detalhes.push(`> ${pao.nome} ${pao.valor > 0 ? `(+${formatarMoeda(pao.valor)})` : ''}`);
      detalhes.push(`> ${salsicha.nome} ${salsicha.valor > 0 ? `(+${formatarMoeda(salsicha.valor)})` : ''}`);

      const pushItem = (id, listaOrigem) => { const item = listaOrigem.find(x => x.id == id); if(item){ totalExtras += item.valor; detalhes.push(`+ ${item.nome} ${item.valor > 0 ? `(+${formatarMoeda(item.valor)})` : ''}`); } };
      montagem.queijoIds.forEach(id => pushItem(id, configMontagem.queijos));
      montagem.molhoIds.forEach(id => pushItem(id, configMontagem.molhos));
      montagem.adicionalIds.forEach(id => pushItem(id, configMontagem.adicionais));

      const precoBaseFix = 15.00; 
      const precoFinal = parseFloat((precoBaseFix + pao.valor + salsicha.valor + totalExtras).toFixed(2));
      const descFinal = detalhes.join('\n');

      const itemMontado = { produtoId: 999, nome: `Dog Montado`, preco: precoFinal, qtd: 1, opcoesSelecionadas: [descFinal], listaAdicionais: [] };
      const itensLimpos = formPedido.itens.filter(i => i.produtoId && i.produtoId !== "");
      setFormPedido({ ...formPedido, itens: [...itensLimpos, itemMontado] }); 
      setModalMonteDogAberto(false); 
      setModalPedidoAberto(true);
  };

  // --- AÇÕES PEDIDO ---
  const salvarPedido = async (e) => {
    e.preventDefault();
    if(!supabase) return alert("ERRO: Configure o Supabase nas primeiras linhas do código!");

    // CORREÇÃO CRÍTICA: Verifica e limpa itens inválidos
    const itensValidos = (formPedido.itens || []).filter(i => i.produtoId);

    if (itensValidos.length === 0) { alert("⚠️ Adicione itens ao pedido!"); return; }
    if (!formPedido.nome) { alert("⚠️ Nome obrigatório!"); return; }

    const pedidoData = { 
        cliente: { nome: formPedido.nome, endereco: formPedido.endereco, telefone: formPedido.telefone },
        itens: itensValidos,
        total: calcularTotalPedido(itensValidos, formPedido.taxaEntrega, formPedido.desconto),
        taxa_entrega: parseFloat(formPedido.taxaEntrega || 0), // Garante número
        pagamento: formPedido.pagamento,
        troco_para: parseFloat(formPedido.trocoPara || 0), // Garante número
        observacoes: formPedido.observacoes,
        desconto: parseFloat(formPedido.desconto || 0), // Garante número
        data: formPedido.id ? formPedido.data : getDataHoje(),
        hora: formPedido.id ? formPedido.hora : new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        status: formPedido.id ? formPedido.status : "Pendente"
    };

    try {
        if (formPedido.id) {
            await supabase.from('pedidos').update(pedidoData).eq('id', formPedido.id);
        } else {
            await supabase.from('pedidos').insert([pedidoData]);
        }
        setFormPedido(getFormPedidoInicial());
        setModalPedidoAberto(false);
        tocarSom();
    } catch (err) {
        alert("Erro ao salvar: " + err.message);
    }
  };

  const avançarStatus = async (id) => {
    const pedido = pedidos.find(p => p.id === id);
    if(!pedido) return;
    let novo = '';
    if(pedido.status === 'Pendente') novo = 'Saiu para Entrega';
    else if (pedido.status === 'Saiu para Entrega') novo = 'Concluido';
    
    if(novo) {
        await supabase.from('pedidos').update({ status: novo }).eq('id', id);
        if(novo === 'Saiu para Entrega') setTimeout(() => enviarZap({...pedido, status: novo}), 100);
        // Baixa de estoque simplificada
        if(novo === 'Concluido' && pedido.itens) {
            pedido.itens.forEach(async i => {
                if(i.produtoId === 999) return;
                const p = produtos.find(x => x.id == i.produtoId);
                if(p) await supabase.from('produtos').update({ estoque: Math.max(0, p.estoque - i.qtd) }).eq('id', p.id);
            });
        }
    }
  };

  const cancelarPedido = async (id) => { if(confirm("Cancelar?")) await supabase.from('pedidos').update({ status: 'Cancelado' }).eq('id', id); };

  // Filtros
  const pedidosHoje = useMemo(() => pedidos.filter(p => p.data === getDataHoje()), [pedidos]);
  const pedidosPendentes = useMemo(() => pedidos.filter(p => p.status !== 'Concluido' && p.status !== 'Cancelado'), [pedidos]);
  const kpis = useMemo(() => { const concluidos = pedidosHoje.filter(p => p.status === 'Concluido'); const total = concluidos.reduce((acc, p) => acc + (p.total || 0), 0); return { totalHoje: total, qtdHoje: concluidos.length, ticketMedio: concluidos.length > 0 ? total / concluidos.length : 0 }; }, [pedidosHoje]);

  // UI Helpers
  const abrirNovoPedido = () => { setFormPedido(getFormPedidoInicial()); setModalPedidoAberto(true); };
  const abrirMonteDog = () => { 
      setFormPedido(getFormPedidoInicial()); // Limpa pedido antes de começar montagem
      const pId = configMontagem.paes[0]?.id; 
      const sId = configMontagem.salsichas[0]?.id; 
      setMontagem({ paoId: pId, salsichaId: sId, queijoIds: [], molhoIds: [], adicionalIds: [] }); 
      setModalMonteDogAberto(true); 
  };
  const abrirNovoProduto = () => { setFormProduto({ ...formProdutoInicial, categoria: filtroCardapio === 'Adicionais' ? 'Adicionais' : filtroCardapio, tipo: filtroCardapio === 'Adicionais' ? 'adicional' : 'principal' }); setModalProdutoAberto(true); };
  const abrirNovoCliente = () => { setFormCliente(formClienteInicial); setModalClienteAberto(true); };
  const editarPedido = (p) => { setFormPedido({...p, itens: p.itens || [], clienteId: null, taxaEntrega: p.taxa_entrega, trocoPara: p.troco_para }); setModalPedidoAberto(true); }; 
  const editarCliente = (c) => { setFormCliente(c); setModalClienteAberto(true); };
  const editarProduto = (p) => { setFormProduto(p); setModalProdutoAberto(true); };
  const selecionarClienteNoPedido = (id) => { const c = clientes.find(x => x.id == id); if(c) setFormPedido({...formPedido, clienteId: c.id, nome: c.nome, endereco: c.endereco, telefone: c.telefone, taxaEntrega: 0}); };
  const atualizarItem = (idx, f, v) => { const ns = [...formPedido.itens]; ns[idx][f] = v; if(f === 'produtoId') { const p = produtos.find(x => x.id == v); if(p) { ns[idx].nome = p.nome; ns[idx].preco = p.preco; ns[idx].opcoesSelecionadas = []; ns[idx].listaAdicionais = []; } } setFormPedido({...formPedido, itens: ns}); };
  const toggleAdicionalItem = (idx, id) => { const ns = [...formPedido.itens]; const l = ns[idx].listaAdicionais || []; ns[idx].listaAdicionais = l.includes(id) ? l.filter(x => x !== id) : [...l, id]; setFormPedido({...formPedido, itens: ns}); };
  const toggleOpcaoItem = (idx, opcao) => { const ns = [...formPedido.itens]; const atuais = ns[idx].opcoesSelecionadas || []; if (atuais.includes(opcao)) { ns[idx].opcoesSelecionadas = atuais.filter(o => o !== opcao); } else { ns[idx].opcoesSelecionadas = [...atuais, opcao]; } setFormPedido({...formPedido, itens: ns}); };

  const enviarZap = (p) => {
    let msgTroco = "";
    if(p.pagamento === 'Dinheiro' && p.troco_para) msgTroco = `\n💵 *Troco p/ ${formatarMoeda(p.troco_para)}* (Devolver: ${formatarMoeda(Number(p.troco_para) - p.total)})`;
    else if (p.pagamento !== 'Dinheiro') msgTroco = `\n💳 Levar Maquininha (${p.pagamento})`;
    const saudacao = p.status === 'Saiu para Entrega' ? `🛵 *SEU PEDIDO SAIU!*` : `Olá ${p.cliente?.nome || ''}! 🌭🔥`;
    const txt = `${saudacao}\n\n*PEDIDO #${p.id}*\n📍 ${p.cliente?.endereco || 'Balcão'}\n\n${p.itens.map(i => `${i.qtd}x ${i.nome}\n   ${(i.opcoesSelecionadas||[]).join('\n   ')}`).join('\n')}\n\n💰 *Total: ${formatarMoeda(p.total)}*${msgTroco}`;
    window.open(`https://wa.me/55${p.cliente?.telefone?.replace(/\D/g,'')}?text=${encodeURIComponent(txt)}`, '_blank');
  };
  const abrirNoMaps = (end) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(end)}`, '_blank');
  
  // IMPRESSÃO (Corrigido para usar os campos certos do DB: taxa_entrega, troco_para)
  const imprimir = (p) => {
    const subtotal = calcularSubtotalItens(p.itens);
    const descontoVal = subtotal * ((p.desconto || 0) / 100);
    const totalFinal = (subtotal - descontoVal) + Number(p.taxa_entrega);
    const troco = p.troco_para ? Number(p.troco_para) - totalFinal : 0;

    const conteudoHtml = `<html><head><meta charset="utf-8"><style>@page{margin:0;size:80mm auto}body{margin:0;padding:5px;font-family:'Courier New',monospace;font-size:12px;color:#000;width:72mm;background:#fff}.header{text-align:center;margin-bottom:10px;border-bottom:2px solid #000;padding-bottom:10px}.title{font-size:20px;font-weight:900;margin:0}.meta{font-size:12px;display:flex;justify-content:space-between;margin-top:5px;font-weight:bold}.section{margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed #000}.client-name{font-size:16px;font-weight:800;text-transform:uppercase}.client-address{font-size:14px;margin-top:4px;font-weight:600;line-height:1.2}.item-box{padding:6px 0;border-bottom:1px dotted #999}.item-header{font-size:13px;font-weight:800;display:flex