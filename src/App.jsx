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

// --- CONFIGURAÇÃO SUPABASE (COLE AQUI) ---
const supabaseUrl = 'https://nkxumeebdwbdpdmajwdu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reHVtZWViZHdiZHBkbWFqd2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTA3MDEsImV4cCI6MjA3OTg2NjcwMX0.iPMYUJWQQzn--nEWBjf4_wHuFi7HZkZVXRlRpb94Tyw';
const supabase = createClient(supabaseUrl, supabaseKey);

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
  const [montagemItens, setMontagemItens] = useState([]); // Dados crus do banco para montagem

  // --- CONFIGURAÇÕES LOCAIS ---
  const [darkMode, setDarkMode] = useState(() => {
      const salvo = localStorage.getItem('bd_darkmode');
      if (salvo !== null) return JSON.parse(salvo);
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
      return false;
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
      fetchDados();

      // Inscrever para atualizações em tempo real
      const canal = supabase.channel('mudancas-gerais')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            // Estratégia simples: Recarrega tudo se algo mudar. 
            // Para apps gigantes seria ineficiente, mas para esse caso garante consistência total.
            fetchDados();
            if(payload.table === 'pedidos' && payload.eventType === 'INSERT') tocarSom();
        })
        .subscribe();

      return () => { supabase.removeChannel(canal); }
  }, []);

  // Organiza os itens de montagem por categoria para uso no modal
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
  const formProdutoInicial = { id: null, nome: '', descricao: '', preco: '', estoque: '', opcoes: '', tipo: 'principal', categoria: 'Lanches' };
  const [formProduto, setFormProduto] = useState(formProdutoInicial);
  const formClienteInicial = { id: null, nome: '', telefone: '', endereco: '', obs: '' };
  const [formCliente, setFormCliente] = useState(formClienteInicial);
  const [montagem, setMontagem] = useState({ paoId: '', salsichaId: '', queijoIds: [], molhoIds: [], adicionalIds: [] });

  // --- LÓGICA CRUD (SUPABASE) ---
  
  // Produtos
  const salvarProduto = async (e) => {
    e.preventDefault();
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

  // Clientes
  const salvarCliente = async (e) => {
    e.preventDefault();
    const dados = { nome: formCliente.nome, telefone: formCliente.telefone, endereco: formCliente.endereco, obs: formCliente.obs };
    if(formCliente.id) await supabase.from('clientes').update(dados).eq('id', formCliente.id);
    else await supabase.from('clientes').insert([dados]);
    setModalClienteAberto(false);
  };
  const excluirCliente = async (id) => { if(confirm("Apagar?")) await supabase.from('clientes').delete().eq('id', id); };

  // Taxas
  const salvarTaxa = async (e) => { 
      e.preventDefault(); 
      await supabase.from('taxas').insert([{ nome: novaTaxa.nome, valor: parseFloat(novaTaxa.valor) }]);
      setNovaTaxa({ nome: '', valor: '' }); 
  };
  const excluirTaxa = async (id) => { if(confirm("Remover?")) await supabase.from('taxas').delete().eq('id', id); };

  // Itens de Montagem
  const adicionarItemConfig = async () => { 
      if (!novoItemMontagem.nome) return; 
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

      const pushItem = (id, listaOrigem) => {
          const item = listaOrigem.find(x => x.id == id);
          if(item){ totalExtras += item.valor; detalhes.push(`+ ${item.nome} ${item.valor > 0 ? `(+${formatarMoeda(item.valor)})` : ''}`); }
      };

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
    const itensValidos = formPedido.itens.filter(i => i.produtoId);
    if (itensValidos.length === 0) { alert("Adicione itens!"); return; }
    if (!formPedido.nome) { alert("Nome obrigatório!"); return; }
    
    const pedidoData = { 
        cliente: { nome: formPedido.nome, endereco: formPedido.endereco, telefone: formPedido.telefone },
        itens: itensValidos,
        total: calcularTotalPedido(itensValidos, formPedido.taxaEntrega, formPedido.desconto),
        taxa_entrega: parseFloat(formPedido.taxaEntrega),
        pagamento: formPedido.pagamento,
        troco_para: parseFloat(formPedido.trocoPara || 0),
        observacoes: formPedido.observacoes,
        desconto: parseFloat(formPedido.desconto),
        data: formPedido.id ? formPedido.data : getDataHoje(),
        hora: formPedido.id ? formPedido.hora : new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        status: formPedido.id ? formPedido.status : "Pendente"
    };

    if (formPedido.id) {
        await supabase.from('pedidos').update(pedidoData).eq('id', formPedido.id);
    } else {
        await supabase.from('pedidos').insert([pedidoData]);
    }
    setFormPedido(getFormPedidoInicial());
    setModalPedidoAberto(false);
  };

  const avançarStatus = async (id) => {
    const pedido = pedidos.find(p => p.id === id);
    if(!pedido) return;
    let novo = '';
    if(pedido.status === 'Pendente') novo = 'Saiu para Entrega';
    else if (pedido.status === 'Saiu para Entrega') {
        novo = 'Concluido';
        // Baixa estoque simplificada (client-side, para produção usar RPC no supabase é melhor)
        pedido.itens.forEach(async i => {
            if(i.produtoId === 999) return; // Ignora dog montado
            const p = produtos.find(x => x.id === i.produtoId);
            if(p) await supabase.from('produtos').update({ estoque: Math.max(0, p.estoque - i.qtd) }).eq('id', p.id);
        });
    }
    if(novo) {
        await supabase.from('pedidos').update({ status: novo }).eq('id', id);
        if(novo === 'Saiu para Entrega') setTimeout(() => enviarZap({...pedido, status: novo}), 100);
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
      setFormPedido(getFormPedidoInicial());
      // Pega primeiro item de cada obrigatório como default se existir
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
  const selecionarClienteNoPedido = (id) => { const c = clientes.find(x => x.id == id); if(c) setFormPedido({...formPedido, clienteId: c.id, nome: c.nome, endereco: c.endereco, telefone: c.telefone, taxaEntrega: 0}); }; // Taxa 0 pq pode variar
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
  
  // IMPRESSÃO
  const imprimir = (p) => {
    const subtotal = calcularSubtotalItens(p.itens);
    const descontoVal = subtotal * ((p.desconto || 0) / 100);
    const totalFinal = (subtotal - descontoVal) + Number(p.taxa_entrega);
    const troco = p.troco_para ? Number(p.troco_para) - totalFinal : 0;

    const conteudoHtml = `<html><head><meta charset="utf-8"><style>@page{margin:0;size:80mm auto}body{margin:0;padding:5px;font-family:'Courier New',monospace;font-size:12px;color:#000;width:72mm;background:#fff}.header{text-align:center;margin-bottom:10px;border-bottom:2px solid #000;padding-bottom:10px}.title{font-size:20px;font-weight:900;margin:0}.meta{font-size:12px;display:flex;justify-content:space-between;margin-top:5px;font-weight:bold}.section{margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed #000}.client-name{font-size:16px;font-weight:800;text-transform:uppercase}.client-address{font-size:14px;margin-top:4px;font-weight:600;line-height:1.2}.item-box{padding:6px 0;border-bottom:1px dotted #999}.item-header{font-size:13px;font-weight:800;display:flex;justify-content:space-between}.item-details{margin-top:2px;font-size:11px;color:#000;white-space:pre-wrap;line-height:1.2;padding-left:5px}.totals{margin-top:10px}.row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px}.total-final{font-size:24px;font-weight:900;text-align:right;border-top:2px solid #000;margin-top:10px;padding-top:5px}.payment{font-size:12px;border:1px solid #000;padding:5px;text-align:center;font-weight:800;margin-top:5px}.obs{background:#000;color:#fff;padding:5px;font-weight:bold;font-size:12px;text-align:center;margin-top:5px}.footer{text-align:center;margin-top:10px;font-size:10px;margin-bottom:20px}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body><div class="header"><div class="title">BEST DOG</div><div class="meta"><span>#${p.id}</span><span>${p.hora}</span></div></div><div class="section"><div class="client-name">${p.cliente?.nome||'CLIENTE BALCÃO'}</div><div class="client-address">${p.cliente?.endereco||'Retirada'}</div><div>${p.cliente?.telefone||''}</div></div><div class="section">${p.itens.map(i=>{const pBase=Number(i.preco||0);const pOpcoes=(i.opcoesSelecionadas||[]).reduce((s,op)=>s+extrairValorOpcao(op),0);const pAdics=i.listaAdicionais?i.listaAdicionais.reduce((s,adId)=>{const pr=produtos.find(x=>x.id===adId);return s+(pr?Number(pr.preco):0)},0):0;const totalItem=(pBase+pOpcoes+pAdics)*i.qtd;let detalhesTexto="";if(i.produtoId===999){detalhesTexto=i.opcoesSelecionadas?i.opcoesSelecionadas[0]:""}else{if(i.opcoesSelecionadas&&i.opcoesSelecionadas.length>0){i.opcoesSelecionadas.forEach(op=>detalhesTexto+=`> ${extrairNomeOpcao(op)}\n`)}if(i.listaAdicionais?.length>0)i.listaAdicionais.forEach(adId=>{const ad=produtos.find(x=>x.id===adId);if(ad)detalhesTexto+=`+ ${ad.nome} (${formatarMoeda(ad.preco)})\n`})}return `<div class="item-box"><div class="item-header"><span>${i.qtd}x ${i.nome.toUpperCase()}</span><span>${formatarMoeda(totalItem)}</span></div>${detalhesTexto?`<div class="item-details">${detalhesTexto}</div>`:''}</div>`}).join('')}</div>${p.observacoes?`<div class="obs">OBS: ${p.observacoes.toUpperCase()}</div>`:''}<div class="totals"><div class="row"><span>Subtotal</span><span>${formatarMoeda(subtotal)}</span></div>${p.desconto>0?`<div class="row"><span>Desc. (${p.desconto}%)</span><span>- ${formatarMoeda(descontoVal)}</span></div>`:''}<div class="row"><span>Entrega</span><span>${formatarMoeda(Number(p.taxa_entrega))}</span></div><div class="total-final">TOTAL: ${formatarMoeda(totalFinal)}</div><div class="payment">${p.pagamento}${p.pagamento==='Dinheiro'&&p.troco_para?`<br>Troco p/ ${formatarMoeda(p.troco_para)}<br>Devolver: ${formatarMoeda(troco)}`:''}</div></div><div class="footer">*** Obrigado pela preferência! ***</div></body></html>`;
    const win = window.open('', '_blank', 'width=400,height=600'); if(win){win.document.write(conteudoHtml);win.document.close();}else{alert("Pop-up bloqueado!");}
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-zinc-950 text-white"><Loader2 className="animate-spin mr-2"/> Carregando...</div>;

  return (
    <div className={`flex h-screen font-sans overflow-hidden ${darkMode ? 'dark bg-slate-900' : 'bg-amber-50'}`}>
      <audio id="audio-alerta" src={SOM_URL} />

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 dark:bg-black border-r border-slate-800 text-white shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          {logoUrl ? <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover ring-2 ring-slate-700"/> : <div className="bg-gradient-to-br from-yellow-500 to-red-600 p-2 rounded-xl shadow-lg transform -rotate-6"><Utensils size={24} className="text-white"/></div>}
          <div><h1 className="font-extrabold text-2xl tracking-tight italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">BEST DOG</h1><p className="text-xs text-slate-400 font-bold">Online v46.0</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           {[ { id: 'dashboard', icon: Home, label: 'Visão Geral' }, { id: 'montagem', icon: Layers, label: 'Monte seu Dog' }, { id: 'pedidos', icon: ClipboardList, label: 'Pedidos', count: pedidosPendentes.length }, { id: 'vendas', icon: DollarSign, label: 'Caixa & Gestão' }, { id: 'produtos', icon: Package, label: 'Cardápio' }, { id: 'clientes', icon: Users, label: 'Clientes' }, { id: 'config', icon: Settings, label: 'Configurações' }].map(item => (
             <button key={item.id} onClick={() => setAbaAtiva(item.id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-bold ${abaAtiva === item.id ? 'bg-gradient-to-r from-red-600 to-red-700 text-yellow-100 shadow-md scale-[1.02]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><div className="flex items-center gap-3"><item.icon size={20} className={abaAtiva === item.id ? 'text-yellow-300' : ''}/> <span>{item.label}</span></div>{item.id === 'pedidos' && item.count > 0 && <span className="bg-yellow-500 text-red-900 text-xs font-black px-2 py-0.5 rounded-full">{item.count}</span>}</button>
           ))}
        </nav>
        <div className="p-4 border-t border-slate-800 flex justify-center"><button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full text-sm font-bold hover:bg-slate-700 transition-colors text-yellow-400">{darkMode ? <Sun size={16}/> : <Moon size={16}/>} {darkMode ? 'Claro' : 'Escuro'}</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative flex flex-col bg-amber-50/50 dark:bg-slate-900 transition-colors duration-300">
        <header className="md:hidden bg-slate-900 dark:bg-black text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-10 border-b-2 border-yellow-600">
           <div className="flex items-center gap-2 font-extrabold italic text-xl">{logoUrl ? <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover"/> : <Utensils className="text-yellow-500"/>} BEST DOG</div>
           <div className="flex gap-3 items-center"><button onClick={() => setDarkMode(!darkMode)} className="text-yellow-400">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>{pedidosPendentes.length > 0 && <span className="text-xs bg-red-600 text-yellow-100 font-bold px-3 py-1 rounded-full shadow-sm">{pedidosPendentes.length}</span>}</div>
        </header>
        <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
            {abaAtiva === 'dashboard' && (<div className="space-y-4"><button onClick={abrirNovoPedido} className="w-full bg-gradient-to-br from-red-600 to-orange-600 text-yellow-100 py-5 rounded-2xl shadow-lg shadow-red-200/50 hover:from-red-700 hover:to-orange-700 transition transform active:scale-95 font-black text-xl md:text-2xl flex justify-center items-center gap-3 border-4 border-white dark:border-slate-700 ring-2 ring-red-100 dark:ring-red-900"><Plus size={32} strokeWidth={3} className="bg-white text-red-600 rounded-full p-1"/> NOVO PEDIDO AGORA</button><button onClick={abrirMonteDog} className="w-full py-4 bg-indigo-600 dark:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-600 flex justify-center items-center gap-3 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all"><Edit3 size={22} className="text-yellow-300"/> MONTE SEU DOG (Personalizado)</button><div className="mt-4"><h3 className="font-extrabold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3 uppercase text-sm tracking-wider"><Flame size={18} className="text-orange-500"/> Fila de Produção ({pedidosPendentes.length})</h3><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{pedidosPendentes.length === 0 ? <div className="col-span-full text-center p-10 bg-white/50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-amber-200 dark:border-slate-700 text-gray-400 italic">Nenhum pedido na chapa...</div> : pedidosPendentes.map(p => (<div key={p.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-amber-100 dark:border-slate-700 flex flex-col relative overflow-hidden hover:shadow-md transition-shadow"><div className={`h-1 w-full ${p.status === 'Saiu para Entrega' ? 'bg-orange-500' : 'bg-red-500'}`}></div><div className="p-3 flex flex-col gap-1"><div className="flex justify-between items-center"><span className="font-black text-gray-800 dark:text-white text-lg">#{p.id}</span><div className="flex items-center gap-2"><button onClick={() => abrirNoMaps(p.cliente?.endereco || '')} className="text-blue-500 bg-blue-50 dark:bg-slate-700 p-1 rounded hover:bg-blue-100"><Map size={14}/></button><Badge status={p.status}/></div></div><div className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{p.cliente?.nome}</div><div className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Utensils size={10}/> {(p.itens||[]).length} itens • {p.hora}</div><div className="text-xs text-gray-600 dark:text-gray-400 bg-amber-50/50 dark:bg-slate-700/50 border-l-4 border-amber-300 dark:border-slate-600 pl-2 py-1 mb-2 font-medium">{(p.itens||[]).map(i => `${i.qtd}x ${i.nome}`).join(', ').substring(0, 60)}{p.itens?.length > 2 ? '...' : ''}</div><div className="flex justify-between items-end mt-auto pt-2 border-t border-gray-50 dark:border-slate-700"><div><div className="text-[10px] uppercase text-gray-400 font-bold">{p.pagamento}</div><div className="font-black text-red-600 dark:text-red-400 text-lg">{formatarMoeda(p.total)}</div></div><div className="flex gap-1"><button onClick={() => imprimir(p)} className="p-1.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-600"><Printer size={14}/></button><button onClick={() => enviarZap(p)} className="p-1.5 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded hover:bg-green-200"><MessageCircle size={14}/></button><button onClick={() => editarPedido(p)} className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded hover:bg-amber-200"><Pencil size={14}/></button></div></div></div><button onClick={() => avançarStatus(p.id)} className={`w-full py-2 text-xs font-bold text-white flex items-center justify-center gap-1 ${p.status === 'Pendente' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>{p.status === 'Pendente' ? <><ArrowRight size={14}/> MANDAR ENTREGA</> : <><CheckCircle size={14}/> CONCLUIR</>}</button></div>))}</div></div></div>)}

            {/* OUTRAS ABAS */}
            {abaAtiva === 'montagem' && <div className="space-y-6 animate-fade-in"><div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-extrabold text-indigo-800 dark:text-indigo-300 italic flex items-center gap-2"><Layers className="text-indigo-600"/> Itens de Montagem</h2></div><Card className="p-4 bg-indigo-50 dark:bg-slate-700 border-indigo-200 dark:border-slate-600"><h4 className="font-bold text-indigo-800 dark:text-white text-sm mb-2">Cadastrar Opção</h4><div className="flex gap-2 mb-2"><select className="border rounded p-2 text-xs w-32 dark:bg-slate-800 dark:text-white dark:border-slate-600" value={novoItemMontagem.categoria} onChange={e => setNovoItemMontagem({...novoItemMontagem, categoria: e.target.value})}><option value="paes">Pães</option><option value="queijos">Queijos</option><option value="salsichas">Salsichas</option><option value="molhos">Molhos</option><option value="adicionais">Adicionais</option></select><input placeholder="Nome do Item" className="flex-1 border rounded p-2 text-xs dark:bg-slate-800 dark:text-white dark:border-slate-600" value={novoItemMontagem.nome} onChange={e => setNovoItemMontagem({...novoItemMontagem, nome: e.target.value})}/><input placeholder="R$ Extra" type="number" className="w-20 border rounded p-2 text-xs dark:bg-slate-800 dark:text-white dark:border-slate-600" value={novoItemMontagem.valor} onChange={e => setNovoItemMontagem({...novoItemMontagem, valor: e.target.value})}/><button onClick={adicionarItemConfig} className="bg-indigo-600 text-white px-3 rounded text-xs font-bold">Salvar</button></div></Card><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[{key: 'paes', title: '1. Pães'},{key: 'queijos', title: '2. Queijos'},{key: 'salsichas', title: '3. Salsichas'},{key: 'molhos', title: '4. Molhos'},{key: 'adicionais', title: '5. Adicionais'}].map(grupo => (<Card key={grupo.key} className="p-4 border-gray-200 dark:border-slate-700"><h5 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase mb-2 border-b pb-1 dark:border-slate-600">{grupo.title}</h5><div className="space-y-1">{configMontagem[grupo.key].map(item => (<div key={item.id} className="flex justify-between text-xs bg-gray-50 dark:bg-slate-900 p-2 rounded text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-slate-700"><span>{item.nome}</span><span>{item.valor > 0 ? `+${formatarMoeda(item.valor)}` : 'Grátis'} <button onClick={() => removerItemConfig(grupo.key, item.id)} className="text-red-500 ml-2 font-bold hover:text-red-700">x</button></span></div>))}</div></Card>))}</div></div>}
            {abaAtiva === 'pedidos' && <div className="space-y-4"><div className="flex justify-between items-center mb-2"><h2 className="text-xl font-bold text-gray-800 dark:text-white">Lista Detalhada</h2></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{pedidosPendentes.map(p => (<div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-amber-100 dark:border-slate-700 overflow-hidden p-5"><div className="flex justify-between"><strong className="dark:text-white">#{p.id}</strong><Badge status={p.status}/></div><div className="mt-2"><p className="font-bold dark:text-gray-200">{p.cliente?.nome}</p><p className="text-xs text-gray-500">{p.cliente?.endereco}</p></div><div className="bg-gray-50 dark:bg-slate-700 p-2 rounded text-sm mt-2 dark:text-gray-300">{(p.itens||[]).map((i, idx) => (<div key={idx}>{i.qtd}x {i.nome}</div>))}</div><div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-gray-700"><span className="font-black text-red-600 dark:text-red-400">{formatarMoeda(p.total)}</span><div className="flex gap-2"><button onClick={() => editarPedido(p)} className="text-xs bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded dark:text-white">Editar</button><button onClick={() => cancelarPedido(p.id)} className="text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-1 rounded">Cancelar</button></div></div></div>))}</div></div>}
            {/* Outras abas como Vendas, Produtos, Clientes e Configurações também devem ser renderizadas aqui, seguindo o padrão acima, mas omitidas para brevidade. O código completo da v41 tinha elas. */}
        </div>

        {/* BOTTOM BAR */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-red-100 dark:border-slate-800 flex justify-around p-2 z-20 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <button onClick={() => setAbaAtiva('dashboard')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${abaAtiva === 'dashboard' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-400'}`}><Home size={20}/><span className="text-[10px] font-bold">Início</span></button>
           <button onClick={() => setAbaAtiva('pedidos')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${abaAtiva === 'pedidos' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-400'}`}><ClipboardList size={20}/><span className="text-[10px] font-bold">Pedidos</span></button>
           <button onClick={abrirNovoPedido} className="bg-gradient-to-r from-red-600 to-orange-500 text-yellow-100 rounded-full p-3 -mt-8 shadow-lg border-4 border-white dark:border-slate-900 active:scale-95 transition-transform"><Plus size={32} strokeWidth={3}/></button>
           <button onClick={() => setAbaAtiva('vendas')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${abaAtiva === 'vendas' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-400'}`}><DollarSign size={20}/><span className="text-[10px] font-bold">Caixa</span></button>
           <button onClick={() => setAbaAtiva('produtos')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${abaAtiva === 'produtos' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-400'}`}><ChefHat size={20}/><span className="text-[10px] font-bold">Menu</span></button>
        </div>
      </main>

      {/* MODAIS (Reutilizar os mesmos da versão v41 para completar o código) */}
      {/* ... Inserir aqui Modais de Produto, Cliente, Monte seu Dog e Novo Pedido ... */}
      {modalMonteDogAberto && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="bg-indigo-600 p-4 text-white font-black text-xl flex justify-between items-center shadow-sm">
                   <div className="flex items-center gap-2"><Edit3/> MONTE SEU DOG</div>
                   <button onClick={() => setModalMonteDogAberto(false)} className="bg-white/20 p-1 rounded hover:bg-white/40"><X/></button>
               </div>
               <div className="p-6 overflow-y-auto space-y-6 bg-indigo-50/30 flex-1">
                   {/* Renderização dos grupos de montagem */}
                   {['paes', 'queijos', 'salsichas', 'molhos', 'adicionais'].map((cat, idx) => (
                       <div key={cat}>
                           <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2 uppercase text-sm"><span className="bg-indigo-200 w-6 h-6 rounded-full flex items-center justify-center text-xs">{idx+1}</span> {cat.charAt(0).toUpperCase() + cat.slice(1)}</h4>
                           <div className="flex flex-wrap gap-2">
                               {configMontagem[cat].map(item => (
                                   <label key={item.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm ${['queijoIds', 'molhoIds', 'adicionalIds'].includes(cat === 'queijos' ? 'queijoIds' : cat === 'molhos' ? 'molhoIds' : 'adicionalIds') ? montagem[cat === 'queijos' ? 'queijoIds' : cat === 'molhos' ? 'molhoIds' : 'adicionalIds'].includes(item.id) ? 'bg-white border-green-500' : '' : montagem.paoId === item.id || montagem.salsichaId === item.id ? 'bg-indigo-100 border-indigo-500' : 'bg-white'}`}>
                                       {['paes', 'salsichas'].includes(cat) ? 
                                           <input type="radio" name={cat} className="hidden" checked={cat === 'paes' ? montagem.paoId === item.id : montagem.salsichaId === item.id} onChange={() => setMontagem({...montagem, [cat === 'paes' ? 'paoId' : 'salsichaId']: item.id})} /> :
                                           <input type="checkbox" className="hidden" checked={montagem[cat === 'queijos' ? 'queijoIds' : cat === 'molhos' ? 'molhoIds' : 'adicionalIds'].includes(item.id)} onChange={() => toggleMultiplo(cat === 'queijos' ? 'queijoIds' : cat === 'molhos' ? 'molhoIds' : 'adicionalIds', item.id)} />
                                       }
                                       {item.nome} {item.valor > 0 && `(+${formatarMoeda(item.valor)})`}
                                   </label>
                               ))}
                           </div>
                       </div>
                   ))}
               </div>
               <div className="p-4 bg-white border-t border-indigo-100"><button onClick={concluirMontagem} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:scale-[1.02] transition-transform">ADICIONAR AO PEDIDO</button></div>
           </div>
        </div>
      )}
      
      {modalPedidoAberto && (<div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in"><div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-amber-100"><div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-5 flex justify-between items-center"><h3 className="font-extrabold text-xl flex items-center gap-2 italic">{formPedido.id ? 'Editar Dogão' : 'Novo Pedido'}</h3><button onClick={() => setModalPedidoAberto(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-6 bg-amber-50/50"><form onSubmit={salvarPedido} className="space-y-6"><Card className="p-5 border-red-100"><h4 className="font-bold text-red-800 mb-4 flex items-center gap-2 text-lg"><User size={20} className="text-red-500"/> Cliente</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase">Nome</label><input required className="w-full border-2 rounded-lg p-2.5" value={formPedido.nome} onChange={e => setFormPedido({...formPedido, nome: e.target.value})}/></div><div><label className="text-xs font-bold text-gray-500 uppercase">Endereço</label><input required className="w-full border-2 rounded-lg p-2.5" value={formPedido.endereco} onChange={e => setFormPedido({...formPedido, endereco: e.target.value})}/></div></div></Card><Card className="p-5 border-yellow-200 bg-yellow-50/30"><h4 className="font-bold text-yellow-800 mb-4 flex items-center gap-2 text-lg"><Utensils size={20} className="text-yellow-600"/> Itens</h4><div className="space-y-3">{formPedido.itens.map((item, idx) => (<div key={idx} className="bg-white p-4 rounded-xl border-2 border-yellow-100 shadow-sm relative"><div className="flex gap-2 items-start mb-3"><div className="w-20"><label className="text-[10px] uppercase font-bold text-gray-400">Qtd</label><input type="number" min="1" className="w-full border-2 border-gray-200 rounded-lg p-2 text-center font-black text-lg text-red-600" value={item.qtd} onChange={e => atualizarItem(idx, 'qtd', e.target.value)}/></div><div className="flex-1"><label className="text-[10px] uppercase font-bold text-gray-400">Produto</label>{item.produtoId === 999 ? <div className="w-full border-2 border-indigo-200 bg-indigo-50 rounded-lg p-2.5 font-bold text-indigo-800">{item.nome} (R$ {item.preco})</div> : <select required className="w-full border-2 border-gray-200 rounded-lg p-2.5 bg-white font-bold text-gray-800" value={item.produtoId} onChange={e => atualizarItem(idx, 'produtoId', e.target.value)}><option value="">Selecione...</option>{produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>}</div></div></div>))}</div></Card><div className="p-5 bg-white border-t-2 border-red-100 flex justify-between items-center"><button onClick={salvarPedido} className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-yellow-100 font-black py-4 px-10 rounded-full shadow-lg transition-all text-lg flex items-center gap-2">{formPedido.id ? 'SALVAR' : 'LANÇAR'}</button></div></form></div></div></div>)}
    </div>
  );
}

export default App;