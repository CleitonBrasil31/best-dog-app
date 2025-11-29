/* eslint-disable no-empty */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, MapPin, User, CheckCircle, Utensils, Home,
  Plus, Trash2, X, Package, ClipboardList, Pencil, Settings, 
  Bike, MessageCircle, Map, DollarSign, Users, 
  ChefHat, TrendingUp, AlertCircle, Clock,
  Flame, UserPlus, Phone, Percent, Play, Calendar,
  Coffee, Star, ArrowRight, Edit3, CheckSquare, Square, Layers, Tag, Wand2
} from 'lucide-react';

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
  <div className={`bg-white rounded-xl shadow-sm border border-amber-100/80 overflow-hidden ${className}`}>{children}</div>
);

const Badge = ({ status }) => {
  const styles = {
    'Pendente': 'bg-red-50 text-red-700 border-red-200',
    'Saiu para Entrega': 'bg-orange-50 text-orange-700 border-orange-200',
    'Concluido': 'bg-green-50 text-green-700 border-green-200',
    'Cancelado': 'bg-gray-50 text-gray-500 border-gray-200',
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

  // --- UTILITÁRIOS ---
  const getDataHoje = () => new Date().toISOString().split('T')[0];
  const formatarMoeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  // Carregamento seguro
  const carregarDados = (chave, padrao) => {
    try {
      const salvo = localStorage.getItem(chave);
      return salvo ? JSON.parse(salvo) : padrao;
    } catch (e) { return padrao; }
  };
  
  const tocarSom = () => {
      try {
        const audio = document.getElementById('audio-alerta');
        if (audio) { 
            audio.currentTime = 0; 
            audio.play().catch(() => {}); 
        }
      } catch(e){}
  };

  // --- ESTADOS GLOBAIS ---
  const [taxasFrete, setTaxasFrete] = useState(() => carregarDados('bd_v35_taxas', [{ id: 1, nome: "Bairro Vizinho", valor: 5.00 }, { id: 2, nome: "Centro", valor: 8.00 }]));
  const [produtos, setProdutos] = useState(() => carregarDados('bd_v35_produtos', [
    { id: 1, nome: "Dogão Simples", descricao: "Pão, salsicha, purê...", preco: 18.00, estoque: 50, opcoes: "Salsicha, Vina Dupla =+4.00", tipo: 'principal', categoria: 'Lanches' },
    { id: 2, nome: "Coca-Cola Lata", preco: 6.00, estoque: 24, opcoes: "", tipo: 'principal', categoria: 'Bebidas' },
  ]));
  const [clientes, setClientes] = useState(() => carregarDados('bd_v35_clientes', []));
  const [pedidos, setPedidos] = useState(() => carregarDados('bd_v35_pedidos', []));
  const [configMontagem, setConfigMontagem] = useState(() => carregarDados('bd_v35_montagem', {
      paes: [{id: 1, nome: 'Pão de Leite', valor: 0}, {id: 2, nome: 'Pão Australiano', valor: 2.00}],
      queijos: [{id: 1, nome: 'Mussarela', valor: 0}, {id: 2, nome: 'Cheddar', valor: 3.00}],
      salsichas: [{id: 1, nome: 'Tradicional', valor: 0}],
      molhos: [{id: 1, nome: 'Maionese Verde', valor: 0}, {id: 2, nome: 'Ketchup', valor: 0}],
      adicionais: [{id: 1, nome: 'Bacon', valor: 3.00}, {id: 2, nome: 'Purê', valor: 0}]
  }));
  const [filtroData, setFiltroData] = useState(getDataHoje());
  const [novaTaxa, setNovaTaxa] = useState({ nome: '', valor: '' });
  const [novoItemMontagem, setNovoItemMontagem] = useState({ categoria: 'paes', nome: '', valor: '' });

  // PERSISTÊNCIA
  useEffect(() => { localStorage.setItem('bd_v35_taxas', JSON.stringify(taxasFrete)); }, [taxasFrete]);
  useEffect(() => { localStorage.setItem('bd_v35_produtos', JSON.stringify(produtos)); }, [produtos]);
  useEffect(() => { localStorage.setItem('bd_v35_clientes', JSON.stringify(clientes)); }, [clientes]);
  useEffect(() => { localStorage.setItem('bd_v35_pedidos', JSON.stringify(pedidos)); }, [pedidos]);
  useEffect(() => { localStorage.setItem('bd_v35_montagem', JSON.stringify(configMontagem)); }, [configMontagem]);

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

  // --- LÓGICA CRUD ---
  const adicionarItemConfig = () => { if (!novoItemMontagem.nome) return; const cat = novoItemMontagem.categoria; const novoItem = { id: Date.now(), nome: novoItemMontagem.nome, valor: parseFloat(novoItemMontagem.valor || 0) }; setConfigMontagem({ ...configMontagem, [cat]: [...configMontagem[cat], novoItem] }); setNovoItemMontagem({ ...novoItemMontagem, nome: '', valor: '' }); };
  const removerItemConfig = (categoria, id) => { setConfigMontagem({ ...configMontagem, [categoria]: configMontagem[categoria].filter(i => i.id !== id) }); };
  const salvarTaxa = (e) => { e.preventDefault(); if (!novaTaxa.nome || !novaTaxa.valor) return; setTaxasFrete([...taxasFrete, { id: Date.now(), nome: novaTaxa.nome, valor: parseFloat(novaTaxa.valor) }]); setNovaTaxa({ nome: '', valor: '' }); };
  const excluirTaxa = (id) => { if(confirm("Remover taxa?")) setTaxasFrete(taxasFrete.filter(t => t.id !== id)); };
  
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
          if(item){
              totalExtras += item.valor;
              detalhes.push(`+ ${item.nome} ${item.valor > 0 ? `(+${formatarMoeda(item.valor)})` : ''}`);
          }
      };

      montagem.queijoIds.forEach(id => pushItem(id, configMontagem.queijos));
      montagem.molhoIds.forEach(id => pushItem(id, configMontagem.molhos));
      montagem.adicionalIds.forEach(id => pushItem(id, configMontagem.adicionais));

      const precoBaseFix = 15.00; 
      const precoFinal = parseFloat((precoBaseFix + pao.valor + salsicha.valor + totalExtras).toFixed(2));
      const descFinal = detalhes.join('\n');

      const itemMontado = { 
          produtoId: 999, 
          nome: `Dog Montado`, 
          preco: precoFinal, 
          qtd: 1, 
          opcoesSelecionadas: [descFinal], 
          listaAdicionais: [] 
      };
      
      const itensLimpos = formPedido.itens.filter(i => i.produtoId && i.produtoId !== "");
      setFormPedido({ ...formPedido, itens: [...itensLimpos, itemMontado] }); 
      setModalMonteDogAberto(false); 
      setModalPedidoAberto(true);
  };

  // --- AÇÕES CRUD PEDIDO ---
  const salvarPedido = (e) => {
    e.preventDefault();
    const itensValidos = formPedido.itens.filter(i => i.produtoId);
    if (itensValidos.length === 0) { alert("⚠️ Adicione itens ao pedido!"); return; }
    if (!formPedido.nome) { alert("⚠️ Nome obrigatório!"); return; }
    
    const pedidoFmt = { 
        ...formPedido,
        itens: itensValidos,
        id: formPedido.id || Math.floor(Math.random() * 100000), 
        total: calcularTotalPedido(itensValidos, formPedido.taxaEntrega, formPedido.desconto), 
        data: formPedido.id ? pedidos.find(p => p.id === formPedido.id)?.data : getDataHoje(), 
        hora: formPedido.id ? pedidos.find(p => p.id === formPedido.id)?.hora : new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), 
        status: formPedido.id ? pedidos.find(p => p.id === formPedido.id)?.status : "Pendente", 
        cliente: { nome: formPedido.nome, endereco: formPedido.endereco, telefone: formPedido.telefone } 
    };

    if (formPedido.id) setPedidos(pedidos.map(p => p.id === formPedido.id ? pedidoFmt : p));
    else { setPedidos([pedidoFmt, ...pedidos]); tocarSom(); }
    
    setFormPedido(getFormPedidoInicial());
    setModalPedidoAberto(false);
  };

  const baixarEstoque = (pedido) => { const novosProds = [...produtos]; pedido.itens.forEach(item => { const idx = novosProds.findIndex(p => p.id == item.produtoId); if(idx >= 0) novosProds[idx].estoque = Math.max(0, (novosProds[idx].estoque || 0) - item.qtd); item.listaAdicionais?.forEach(adId => { const idxAd = novosProds.findIndex(p => p.id == adId); if(idxAd >= 0) novosProds[idxAd].estoque = Math.max(0, (novosProds[idxAd].estoque || 0) - item.qtd); }); }); setProdutos(novosProds); };
  const avançarStatus = (id) => { const pedido = pedidos.find(p => p.id === id); if(!pedido) return; if(pedido.status === 'Pendente') { setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: 'Saiu para Entrega' } : p)); setTimeout(() => { enviarZap({ ...pedido, status: 'Saiu para Entrega' }); }, 100); } else if (pedido.status === 'Saiu para Entrega') { setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: 'Concluido' } : p)); baixarEstoque(pedido); } };
  const cancelarPedido = (id) => { if(confirm("Cancelar?")) setPedidos(pedidos.map(p => p.id === id ? { ...p, status: 'Cancelado' } : p)); };
  const salvarCliente = (e) => { e.preventDefault(); const c = { ...formCliente, id: formCliente.id || Date.now() }; formCliente.id ? setClientes(clientes.map(cli => cli.id === c.id ? c : cli)) : setClientes([...clientes, c]); setModalClienteAberto(false); };
  const excluirCliente = (id) => { if(confirm("Apagar?")) setClientes(clientes.filter(c => c.id !== id)); };
  const salvarProduto = (e) => { e.preventDefault(); let tipo = formProduto.tipo; if(formProduto.categoria === 'Adicionais') tipo = 'adicional'; const p = { ...formProduto, id: formProduto.id || Date.now(), preco: parseFloat(formProduto.preco||0), estoque: parseInt(formProduto.estoque||0), tipo, descricao: formProduto.descricao || '' }; formProduto.id ? setProdutos(produtos.map(prod => prod.id === p.id ? p : prod)) : setProdutos([...produtos, p]); setModalProdutoAberto(false); };
  const excluirProduto = (id) => { if(confirm("Excluir?")) setProdutos(produtos.filter(p => p.id !== id)); };

  const pedidosHoje = useMemo(() => pedidos.filter(p => p.data === getDataHoje()), [pedidos]);
  const pedidosPendentes = useMemo(() => pedidos.filter(p => p.status !== 'Concluido' && p.status !== 'Cancelado'), [pedidos]);
  const kpis = useMemo(() => { const concluidos = pedidosHoje.filter(p => p.status === 'Concluido'); const total = concluidos.reduce((acc, p) => acc + (p.total || 0), 0); return { totalHoje: total, qtdHoje: concluidos.length, ticketMedio: concluidos.length > 0 ? total / concluidos.length : 0 }; }, [pedidosHoje]);

  // --- UI HELPERS ---
  const abrirNovoPedido = () => { setFormPedido(getFormPedidoInicial()); setModalPedidoAberto(true); };
  const abrirMonteDog = () => { 
      setFormPedido(getFormPedidoInicial());
      const pId = configMontagem.paes[0]?.id; 
      const sId = configMontagem.salsichas[0]?.id; 
      setMontagem({ paoId: pId, salsichaId: sId, queijoIds: [], molhoIds: [], adicionalIds: [] }); 
      setModalMonteDogAberto(true); 
  };
  const abrirNovoProduto = () => { setFormProduto({ ...formProdutoInicial, categoria: filtroCardapio === 'Adicionais' ? 'Adicionais' : filtroCardapio, tipo: filtroCardapio === 'Adicionais' ? 'adicional' : 'principal' }); setModalProdutoAberto(true); };
  const abrirNovoCliente = () => { setFormCliente(formClienteInicial); setModalClienteAberto(true); };
  const editarPedido = (p) => { setFormPedido({...p, itens: p.itens || [], clienteId: null}); setModalPedidoAberto(true); }; 
  const editarCliente = (c) => { setFormCliente(c); setModalClienteAberto(true); };
  const editarProduto = (p) => { setFormProduto(p); setModalProdutoAberto(true); };
  const selecionarClienteNoPedido = (id) => { const c = clientes.find(x => x.id == id); if(c) setFormPedido({...formPedido, clienteId: c.id, nome: c.nome, endereco: c.endereco, telefone: c.telefone, taxaEntrega: c.taxaFixa || 0}); };
  const atualizarItem = (idx, f, v) => { const ns = [...formPedido.itens]; ns[idx][f] = v; if(f === 'produtoId') { const p = produtos.find(x => x.id == v); if(p) { ns[idx].nome = p.nome; ns[idx].preco = p.preco; ns[idx].opcoesSelecionadas = []; ns[idx].listaAdicionais = []; } } setFormPedido({...formPedido, itens: ns}); };
  const toggleAdicionalItem = (idx, id) => { const ns = [...formPedido.itens]; const l = ns[idx].listaAdicionais || []; ns[idx].listaAdicionais = l.includes(id) ? l.filter(x => x !== id) : [...l, id]; setFormPedido({...formPedido, itens: ns}); };
  const toggleOpcaoItem = (idx, opcao) => { const ns = [...formPedido.itens]; const atuais = ns[idx].opcoesSelecionadas || []; if (atuais.includes(opcao)) { ns[idx].opcoesSelecionadas = atuais.filter(o => o !== opcao); } else { ns[idx].opcoesSelecionadas = [...atuais, opcao]; } setFormPedido({...formPedido, itens: ns}); };

  const enviarZap = (p) => {
    let msgTroco = "";
    if(p.pagamento === 'Dinheiro' && p.trocoPara) msgTroco = `\n💵 *Troco p/ ${formatarMoeda(p.trocoPara)}* (Devolver: ${formatarMoeda(Number(p.trocoPara) - p.total)})`;
    else if (p.pagamento !== 'Dinheiro') msgTroco = `\n💳 Levar Maquininha (${p.pagamento})`;
    const saudacao = p.status === 'Saiu para Entrega' ? `🛵 *SEU PEDIDO SAIU!*` : `Olá ${p.cliente?.nome || ''}! 🌭🔥`;
    const txt = `${saudacao}\n\n*PEDIDO #${p.id}*\n📍 ${p.cliente?.endereco || 'Balcão'}\n\n${p.itens.map(i => `${i.qtd}x ${i.nome}\n   ${(i.opcoesSelecionadas||[]).join('\n   ')}`).join('\n')}\n\n💰 *Total: ${formatarMoeda(p.total)}*${msgTroco}`;
    window.open(`https://wa.me/55${p.cliente?.telefone?.replace(/\D/g,'')}?text=${encodeURIComponent(txt)}`, '_blank');
  };
  const abrirNoMaps = (end) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(end)}`, '_blank');
  
  // --- IMPRESSÃO (ESTILO CUPOM FISCAL IFOOD) ---
  const imprimir = (p) => {
    const subtotal = calcularSubtotalItens(p.itens);
    const descontoVal = subtotal * ((p.desconto || 0) / 100);
    const totalFinal = (subtotal - descontoVal) + Number(p.taxaEntrega);
    const troco = p.trocoPara ? Number(p.trocoPara) - totalFinal : 0;

    const conteudoHtml = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { 
            font-family: 'Courier New', monospace; 
            width: 72mm; 
            margin: 0; 
            padding: 5px; 
            color: #000; 
            background-color: #fff;
            font-size: 12px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .big { font-size: 16px; }
          .huge { font-size: 20px; }
          .line { border-bottom: 1px dashed #000; margin: 8px 0; }
          .flex { display: flex; justify-content: space-between; }
          .item-container { margin-bottom: 8px; }
          .item-line { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
          .details { padding-left: 0px; font-size: 11px; color: #000; }
          .detail-row { display: block; }
          .box { border: 2px solid #000; padding: 5px; text-align: center; margin: 10px 0; font-weight: bold; font-size: 14px; }
          .obs { background: #eee; padding: 5px; font-weight: bold; border: 1px solid #000; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="center huge bold">BEST DOG</div>
        <div class="center">Delivery & Lanches</div>
        <div class="line"></div>
        
        <div class="flex">
           <span class="bold big">#${p.id}</span>
           <span>${p.hora}</span>
        </div>
        <div class="center" style="font-size:10px;">${new Date().toLocaleDateString('pt-BR')}</div>
        
        <div class="line"></div>
        
        <div class="bold big" style="text-transform:uppercase;">${p.cliente?.nome || 'CLIENTE'}</div>
        <div style="font-size:13px; margin-top:2px;">${p.cliente?.endereco || 'Balcão'}</div>
        <div style="font-size:12px;">${p.cliente?.telefone || ''}</div>
        
        <div class="line"></div>
        <div class="bold" style="margin-bottom:5px;">ITENS DO PEDIDO</div>

        ${p.itens.map(i => {
           const pBase = Number(i.preco||0);
           const pOpcoes=(i.opcoesSelecionadas||[]).reduce((s,op)=>s+extrairValorOpcao(op),0);
           const pAdics=i.listaAdicionais?i.listaAdicionais.reduce((s,adId)=>{const pr=produtos.find(x=>x.id===adId);return s+(pr?Number(pr.preco):0)},0):0;
           const totalItem=(pBase+pOpcoes+pAdics)*i.qtd;
           
           let htmlDetalhes = "";
           
           // Se for Dog Montado, quebra as linhas da descrição
           if(i.produtoId === 999) {
               const linhas = i.opcoesSelecionadas[0].split('\n');
               htmlDetalhes = linhas.map(l => `<span class="detail-row">${l}</span>`).join('');
           } else {
               // Se for normal, monta a lista
               if(i.opcoesSelecionadas && i.opcoesSelecionadas.length > 0) {
                 i.opcoesSelecionadas.forEach(op => htmlDetalhes += `<span class="detail-row">+ ${extrairNomeOpcao(op)}</span>`);
               }
               if(i.listaAdicionais?.length > 0) {
                 i.listaAdicionais.forEach(adId => {
                    const ad = produtos.find(x=>x.id===adId);
                    if(ad) htmlDetalhes += `<span class="detail-row">+ ${ad.nome} (${formatarMoeda(ad.preco)})</span>`;
                 });
               }
           }

           return `
           <div class="item-container">
             <div class="item-line">
                <span>${i.qtd}x ${i.nome.toUpperCase()}</span>
                <span>${formatarMoeda(totalItem)}</span>
             </div>
             <div class="details">
                ${htmlDetalhes}
             </div>
           </div>
           `;
        }).join('')}

        ${p.observacoes ? `<div class="obs">OBS: ${p.observacoes.toUpperCase()}</div>` : ''}

        <div class="line"></div>

        <div class="flex"><span>Subtotal:</span><span>${formatarMoeda(subtotal)}</span></div>
        ${p.desconto > 0 ? `<div class="flex"><span>Desconto:</span><span>- ${formatarMoeda(descontoVal)}</span></div>` : ''}
        <div class="flex"><span>Entrega:</span><span>${formatarMoeda(Number(p.taxaEntrega))}</span></div>
        
        <div class="flex bold big" style="margin-top:5px;">
           <span>TOTAL:</span>
           <span>${formatarMoeda(totalFinal)}</span>
        </div>

        <div class="box">
           ${p.pagamento.toUpperCase()}
           ${p.pagamento==='Dinheiro'&&p.trocoPara ? `<div style="font-size:12px; font-weight:normal; border-top:1px solid #000; margin-top:2px; padding-top:2px;">Troco p/: ${formatarMoeda(p.trocoPara)}<br>TROCO: ${formatarMoeda(troco)}</div>` : ''}
        </div>

        <div class="center" style="margin-top:15px; font-size:10px;">OBRIGADO PELA PREFERÊNCIA!</div>
        <div class="center" style="font-size:10px;">sistema v40.0</div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(conteudoHtml);
    doc.close();

    iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => { document.body.removeChild(iframe); }, 2000);
    };
  };

  return (
    <div className="flex h-screen bg-amber-50 font-sans overflow-hidden">
      <audio id="audio-alerta" src={SOM_URL} />

      <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-red-900/30 text-amber-50 shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-red-900/50">
          <div className="bg-gradient-to-br from-yellow-500 to-red-600 p-2 rounded-xl shadow-lg transform -rotate-6"><Utensils size={24} className="text-white"/></div>
          <div><h1 className="font-extrabold text-2xl tracking-tight italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">BEST DOG</h1><p className="text-xs text-red-300 font-bold">Gerenciador v40.0</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           {[ { id: 'dashboard', icon: Home, label: 'Visão Geral' }, { id: 'montagem', icon: Layers, label: 'Monte seu Dog' }, { id: 'pedidos', icon: ClipboardList, label: 'Lista Detalhada', count: pedidosPendentes.length }, { id: 'vendas', icon: DollarSign, label: 'Caixa & Gestão' }, { id: 'produtos', icon: Package, label: 'Cardápio' }, { id: 'clientes', icon: Users, label: 'Clientes' }, { id: 'config', icon: Settings, label: 'Configurações' }].map(item => (
             <button key={item.id} onClick={() => setAbaAtiva(item.id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-bold ${abaAtiva === item.id ? 'bg-gradient-to-r from-red-600 to-red-700 text-yellow-100 shadow-md scale-[1.02]' : 'text-red-200/70 hover:bg-gray-800 hover:text-white'}`}>
               <div className="flex items-center gap-3"><item.icon size={20} className={abaAtiva === item.id ? 'text-yellow-300' : ''}/> <span>{item.label}</span></div>
               {item.id === 'pedidos' && item.count > 0 && <span className="bg-yellow-500 text-red-900 text-xs font-black px-2 py-0.5 rounded-full">{item.count}</span>}
             </button>
           ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto relative flex flex-col bg-amber-50/50">
        <header className="md:hidden bg-gradient-to-r from-gray-900 to-red-950 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-10 border-b-2 border-yellow-600"><div className="flex items-center gap-2 font-extrabold italic text-xl"><Utensils className="text-yellow-500"/> BEST DOG</div>{pedidosPendentes.length > 0 && <span className="text-xs bg-red-600 text-yellow-100 font-bold px-3 py-1 rounded-full shadow-sm">{pedidosPendentes.length} na fila</span>}</header>
        <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
            {abaAtiva === 'dashboard' && (
              <div className="space-y-4">
                 <button onClick={abrirNovoPedido} className="w-full bg-gradient-to-br from-red-600 to-orange-600 text-yellow-100 py-5 rounded-2xl shadow-lg shadow-red-200/50 hover:from-red-700 hover:to-orange-700 transition transform active:scale-95 font-black text-xl md:text-2xl flex justify-center items-center gap-3 border-4 border-white ring-2 ring-red-100"><Plus size={32} strokeWidth={3} className="bg-white text-red-600 rounded-full p-1"/> NOVO PEDIDO AGORA</button>
                 <button onClick={abrirMonteDog} className="w-full py-4 bg-indigo-600 text-white font-extrabold rounded-xl shadow-md hover:bg-indigo-700 flex justify-center items-center gap-3 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all"><Edit3 size={22} className="text-yellow-300"/> MONTE SEU DOG (Personalizado)</button>
                 <div className="mt-4">
                    <h3 className="font-extrabold text-gray-700 flex items-center gap-2 mb-3 uppercase text-sm tracking-wider"><Flame size={18} className="text-orange-500"/> Fila de Produção ({pedidosPendentes.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {pedidosPendentes.length === 0 ? <div className="col-span-full text-center p-10 bg-white/50 rounded-xl border-2 border-dashed border-amber-200 text-gray-400 italic">Nenhum pedido na chapa...</div> : pedidosPendentes.map(p => (
                           <div key={p.id} className="bg-white rounded-lg shadow-sm border border-amber-100 flex flex-col relative overflow-hidden hover:shadow-md transition-shadow">
                              <div className={`h-1 w-full ${p.status === 'Saiu para Entrega' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                              <div className="p-3 flex flex-col gap-1">
                                 <div className="flex justify-between items-center"><span className="font-black text-gray-800 text-lg">#{p.id}</span><div className="flex items-center gap-2"><button onClick={() => abrirNoMaps(p.cliente?.endereco || '')} className="text-blue-500 bg-blue-50 p-1 rounded hover:bg-blue-100"><Map size={14}/></button><Badge status={p.status}/></div></div>
                                 <div className="text-sm font-bold text-gray-700 truncate">{p.cliente?.nome || 'Cliente'}</div>
                                 <div className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Utensils size={10}/> {(p.itens||[]).length} itens • {p.hora}</div>
                                 <div className="text-xs text-gray-600 bg-amber-50/50 border-l-4 border-amber-300 pl-2 py-1 mb-2 font-medium">{(p.itens||[]).map(i => `${i.qtd}x ${i.nome}`).join(', ').substring(0, 60)}{p.itens?.length > 2 ? '...' : ''}</div>
                                 <div className="flex justify-between items-end mt-auto pt-2 border-t border-gray-50">
                                    <div><div className="text-[10px] uppercase text-gray-400 font-bold">{p.pagamento}</div><div className="font-black text-red-600 text-lg">{formatarMoeda(p.total)}</div></div>
                                    <div className="flex gap-1"><button onClick={() => imprimir(p)} className="p-1.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"><Printer size={14}/></button><button onClick={() => enviarZap(p)} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"><MessageCircle size={14}/></button><button onClick={() => editarPedido(p)} className="p-1.5 bg-amber-100 text-amber-600 rounded hover:bg-amber-200"><Pencil size={14}/></button></div>
                                 </div>
                              </div>
                              <button onClick={() => avançarStatus(p.id)} className={`w-full py-2 text-xs font-bold text-white flex items-center justify-center gap-1 ${p.status === 'Pendente' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>{p.status === 'Pendente' ? <><ArrowRight size={14}/> MANDAR ENTREGA</> : <><CheckCircle size={14}/> CONCLUIR</>}</button>
                           </div>
                        ))}
                    </div>
                 </div>
              </div>
            )}

            {/* DEMAIS ABAS */}
            {abaAtiva === 'pedidos' && <div className="space-y-4"><div className="flex justify-between items-center mb-2"><h2 className="text-xl font-bold text-gray-800">Lista Detalhada</h2></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{pedidosPendentes.map(p => (<div key={p.id} className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col"><div className={`h-1.5 w-full ${p.status === 'Saiu para Entrega' ? 'bg-orange-500' : 'bg-red-500'}`}></div><div className="p-5 flex-1 flex flex-col gap-3"><div className="flex justify-between items-center"><span className="font-black text-gray-400 text-xs tracking-wider">#{p.id}</span><span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Clock size={12}/> {p.hora}</span></div><div><Badge status={p.status}/></div><div><div className="font-bold text-gray-800 text-lg leading-tight">{p.cliente.nome}</div><div className="text-xs text-gray-500 mt-1 flex items-start gap-1"><MapPin size={12} className="mt-0.5 shrink-0 text-red-400"/><span className="line-clamp-2">{p.cliente.endereco}</span></div></div><div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100 mt-1 flex-1">{(p.itens||[]).map((i, idx) => (<div key={idx} className="flex justify-between items-start border-b border-gray-200 last:border-0 pb-1 last:pb-0 mb-1 last:mb-0"><span className="font-bold text-red-600 w-6">{i.qtd}x</span><span className="text-gray-700 flex-1 leading-tight">{i.nome}</span></div>))}{p.observacoes && <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-orange-600 font-bold uppercase">Obs: {p.observacoes}</div>}</div></div><div className="p-4 bg-amber-50/50 border-t border-amber-100 flex justify-between items-center"><div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase">Total</span><span className="font-black text-xl text-gray-800">{formatarMoeda(p.total)}</span></div><div className="flex gap-2"><button onClick={() => imprimir(p)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100" title="Imprimir"><Printer size={14}/></button><button onClick={() => editarPedido(p)} className="px-3 py-1.5 bg-white border border-amber-200 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-50">Editar</button><button onClick={() => cancelarPedido(p.id)} className="px-3 py-1.5 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50">Cancelar</button></div></div></div>))}</div></div>}
            {abaAtiva === 'vendas' && <div className="space-y-6"><div className="grid grid-cols-3 gap-2"><Card className="p-3"><span className="text-xs font-bold">Faturamento</span><h3 className="text-xl font-black">{formatarMoeda(kpis.totalHoje)}</h3></Card><Card className="p-3"><span className="text-xs font-bold">Pedidos</span><h3 className="text-xl font-black">{kpis.qtdHoje}</h3></Card></div><div className="p-3 bg-white rounded border"><input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}/></div><Card className="p-0"><table className="w-full text-xs text-left"><thead className="bg-gray-100"><tr><th className="p-2">#</th><th className="p-2">Nome</th><th className="p-2 text-right">R$</th></tr></thead><tbody>{pedidos.filter(p => (p.status === 'Concluido' || p.status === 'Cancelado') && p.data === filtroData).map(p => <tr key={p.id} className="border-b"><td className="p-2">#{p.id}</td><td className="p-2">{p.cliente.nome}</td><td className="p-2 text-right">{formatarMoeda(p.total)}</td></tr>)}</tbody></table></Card></div>}
            {abaAtiva === 'produtos' && <div className="space-y-4"><div className="flex justify-between"><h2 className="font-bold">Cardápio</h2><button onClick={abrirNovoProduto} className="bg-black text-white px-3 py-1 rounded text-xs font-bold">Add</button></div><div className="flex gap-2 overflow-x-auto pb-2">{['Lanches','Bebidas','Combos','Adicionais'].map(c => <button key={c} onClick={() => setFiltroCardapio(c)} className={`px-3 py-1 rounded-full text-xs border ${filtroCardapio===c?'bg-red-600 text-white':'bg-white'}`}>{c}</button>)}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{produtos.filter(p => {if(filtroCardapio==='Adicionais')return p.tipo==='adicional'; return p.categoria===filtroCardapio && p.tipo!=='adicional'}).map(p => <div key={p.id} className="bg-white p-3 rounded border flex justify-between"><div><div className="font-bold text-sm">{p.nome}</div><div className="text-xs text-gray-500">{formatarMoeda(p.preco)}</div></div><div className="flex gap-2"><button onClick={() => editarProduto(p)}><Pencil size={14}/></button><button onClick={() => excluirProduto(p.id)} className="text-red-500"><Trash2 size={14}/></button></div></div>)}</div></div>}
            {abaAtiva === 'clientes' && <div className="space-y-4"><div className="flex justify-between"><h2 className="font-bold">Clientes</h2><button onClick={abrirNovoCliente} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">Add</button></div><div className="grid grid-cols-1 gap-2">{clientes.map(c => <div key={c.id} className="bg-white p-3 rounded border flex justify-between"><div><div className="font-bold text-sm">{c.nome}</div><div className="text-xs text-gray-500">{c.telefone}</div></div><div className="flex gap-2"><button onClick={() => editarCliente(c)}><Pencil size={14}/></button><button onClick={() => excluirCliente(c.id)} className="text-red-500"><Trash2 size={14}/></button></div></div>)}</div></div>}
            {abaAtiva === 'montagem' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-extrabold text-indigo-800 italic flex items-center gap-2"><Layers className="text-indigo-600"/> Itens de Montagem</h2></div>
                  <Card className="p-4 bg-indigo-50 border-indigo-200">
                     <h4 className="font-bold text-indigo-800 text-sm mb-2">Cadastrar Opção</h4>
                     <div className="flex gap-2 mb-2">
                        <select className="border rounded p-2 text-xs w-32" value={novoItemMontagem.categoria} onChange={e => setNovoItemMontagem({...novoItemMontagem, categoria: e.target.value})}><option value="paes">Pães</option><option value="queijos">Queijos</option><option value="salsichas">Salsichas</option><option value="molhos">Molhos</option><option value="adicionais">Adicionais</option></select>
                        <input placeholder="Nome do Item" className="flex-1 border rounded p-2 text-xs" value={novoItemMontagem.nome} onChange={e => setNovoItemMontagem({...novoItemMontagem, nome: e.target.value})}/>
                        <input placeholder="R$ Extra" type="number" className="w-20 border rounded p-2 text-xs" value={novoItemMontagem.valor} onChange={e => setNovoItemMontagem({...novoItemMontagem, valor: e.target.value})}/>
                        <button onClick={adicionarItemConfig} className="bg-indigo-600 text-white px-3 rounded text-xs font-bold">Salvar</button>
                     </div>
                  </Card>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[{key: 'paes', title: '1. Pães'},{key: 'queijos', title: '2. Queijos'},{key: 'salsichas', title: '3. Salsichas'},{key: 'molhos', title: '4. Molhos'},{key: 'adicionais', title: '5. Adicionais'}].map(grupo => (<Card key={grupo.key} className="p-4 border-gray-200"><h5 className="font-bold text-gray-700 text-xs uppercase mb-2 border-b pb-1">{grupo.title}</h5><div className="space-y-1">{configMontagem[grupo.key].map(item => (<div key={item.id} className="flex justify-between text-xs bg-gray-50 p-2 rounded text-gray-700 border border-gray-100"><span>{item.nome}</span><span>{item.valor > 0 ? `+${formatarMoeda(item.valor)}` : 'Grátis'} <button onClick={() => removerItemConfig(grupo.key, item.id)} className="text-red-500 ml-2 font-bold hover:text-red-700">x</button></span></div>))}</div></Card>))}</div>
               </div>
            )}
            {abaAtiva === 'config' && (<div className="space-y-6"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-extrabold text-gray-800 italic flex items-center gap-2"><Settings className="text-gray-600"/> Configurações</h2></div><Card className="p-6 border-gray-200"><h3 className="font-bold text-lg mb-4">Áudio</h3><button onClick={tocarSom} className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-bold flex items-center gap-2 hover:bg-amber-200"><Play size={18} /> Testar Som</button></Card><Card className="p-6 border-gray-200"><h3 className="font-bold text-lg mb-4">Taxas de Entrega</h3><form onSubmit={salvarTaxa} className="flex gap-2 mb-6"><input placeholder="Descrição" required className="flex-1 border-2 border-gray-200 rounded-lg p-2 text-sm" value={novaTaxa.nome} onChange={e => setNovaTaxa({...novaTaxa, nome: e.target.value})}/><input placeholder="Valor" required type="number" step="0.50" className="w-24 border-2 border-gray-200 rounded-lg p-2 text-sm" value={novaTaxa.valor} onChange={e => setNovaTaxa({...novaTaxa, valor: e.target.value})}/><button type="submit" className="bg-green-600 text-white px-4 rounded-lg font-bold hover:bg-green-700"><Plus/></button></form><div className="space-y-2">{taxasFrete.map(t => (<div key={t.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100"><span className="text-sm text-gray-700 font-medium">{t.nome}</span><div className="flex items-center gap-3"><span className="font-bold text-green-600">{formatarMoeda(t.valor)}</span><button onClick={() => excluirTaxa(t.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></div></div>))}</div></Card></div>)}
        </div>

        {/* BOTTOM BAR */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t-2 border-red-100 flex justify-around p-2 z-20 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <button onClick={() => setAbaAtiva('dashboard')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${abaAtiva === 'dashboard' ? 'text-red-600 bg-red-50 font-bold' : 'text-gray-400'}`}><Home size={20}/><span className="text-[10px] font-bold">Início</span></button>
           <button onClick={() => setAbaAtiva('pedidos')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${abaAtiva === 'pedidos' ? 'text-red-600 bg-red-50 font-bold' : 'text-gray-400'}`}><ClipboardList size={20}/><span className="text-[10px] font-bold">Pedidos</span></button>
           <button onClick={abrirNovoPedido} className="bg-gradient-to-r from-red-600 to-orange-500 text-yellow-100 rounded-full p-3 -mt-8 shadow-lg border-4 border-white active:scale-95 transition-transform"><Plus size={32} strokeWidth={3}/></button>
           <button onClick={() => setAbaAtiva('vendas')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${abaAtiva === 'vendas' ? 'text-red-600 bg-red-50' : 'text-gray-400'}`}><DollarSign size={20}/><span className="text-[10px] font-bold">Caixa</span></button>
           <button onClick={() => setAbaAtiva('produtos')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${abaAtiva === 'produtos' ? 'text-red-600 bg-red-50' : 'text-gray-400'}`}><ChefHat size={20}/><span className="text-[10px] font-bold">Menu</span></button>
        </div>
      </main>

      {/* MODAIS PADRÃO */}
      {modalProdutoAberto && (<div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6"><h3 className="font-bold text-xl mb-4 text-gray-800">{formProduto.id ? 'Editar Produto' : 'Novo Produto'}</h3><form onSubmit={salvarProduto} className="space-y-4"><div><label className="text-xs font-bold uppercase text-gray-500">Nome</label><input required className="w-full border-2 border-gray-200 rounded-lg p-2" value={formProduto.nome} onChange={e => setFormProduto({...formProduto, nome: e.target.value})}/></div><div><label className="text-xs font-bold uppercase text-gray-500">Descrição</label><textarea className="w-full border-2 border-gray-200 rounded-lg p-2 h-16" value={formProduto.descricao} onChange={e => setFormProduto({...formProduto, descricao: e.target.value})}/></div><div className="flex gap-4"><div className="flex-1"><label className="text-xs font-bold uppercase text-gray-500">Preço</label><input required type="number" step="0.50" className="w-full border-2 border-gray-200 rounded-lg p-2" value={formProduto.preco} onChange={e => setFormProduto({...formProduto, preco: e.target.value})}/></div><div className="flex-1"><label className="text-xs font-bold uppercase text-gray-500">Estoque</label><input type="number" className="w-full border-2 border-gray-200 rounded-lg p-2" value={formProduto.estoque} onChange={e => setFormProduto({...formProduto, estoque: e.target.value})}/></div></div><div><label className="text-xs font-bold uppercase text-gray-500">Categoria</label><select className="w-full border-2 border-gray-200 rounded-lg p-2 bg-white" value={formProduto.categoria} onChange={e => setFormProduto({...formProduto, categoria: e.target.value})}><option value="Lanches">Lanches</option><option value="Bebidas">Bebidas</option><option value="Combos">Combos</option><option value="Adicionais">Adicionais</option></select></div>{formProduto.categoria !== 'Adicionais' && formProduto.categoria !== 'Bebidas' && <div><label className="text-xs font-bold uppercase text-gray-500">Opções</label><textarea className="w-full border-2 border-gray-200 rounded-lg p-2 h-20 text-sm" value={formProduto.opcoes} onChange={e => setFormProduto({...formProduto, opcoes: e.target.value})}/></div>}<div className="flex justify-end gap-2 mt-4 pt-4 border-t"><button type="button" onClick={() => setModalProdutoAberto(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button><button type="submit" className="px-6 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-black">Salvar</button></div></form></div></div>)}
      {modalClienteAberto && (<div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6"><h3 className="font-bold text-xl mb-4 text-blue-800 flex items-center gap-2"><UserPlus size={24}/> {formCliente.id ? 'Editar Cliente' : 'Novo Cliente'}</h3><form onSubmit={salvarCliente} className="space-y-4"><div><label className="text-xs font-bold uppercase text-gray-500">Nome</label><input required className="w-full border-2 border-blue-100 rounded-lg p-2" value={formCliente.nome} onChange={e => setFormCliente({...formCliente, nome: e.target.value})}/></div><div><label className="text-xs font-bold uppercase text-gray-500">Telefone</label><input className="w-full border-2 border-blue-100 rounded-lg p-2" value={formCliente.telefone} onChange={e => setFormCliente({...formCliente, telefone: e.target.value})}/></div><div><label className="text-xs font-bold uppercase text-gray-500">Endereço</label><input required className="w-full border-2 border-blue-100 rounded-lg p-2" value={formCliente.endereco} onChange={e => setFormCliente({...formCliente, endereco: e.target.value})}/></div><div className="flex justify-end gap-2 mt-4 pt-4 border-t"><button type="button" onClick={() => setModalClienteAberto(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button><button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Salvar</button></div></form></div></div>)}

      {/* MODAL MONTE SEU DOG (VISUAL TAGS/CHIPS - VERSÃO 29.0 CORRIGIDA) */}
      {modalMonteDogAberto && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="bg-indigo-600 p-4 text-white font-black text-xl flex justify-between items-center shadow-sm">
                   <div className="flex items-center gap-2"><Edit3/> MONTE SEU DOG</div>
                   <button onClick={() => setModalMonteDogAberto(false)} className="bg-white/20 p-1 rounded hover:bg-white/40"><X/></button>
               </div>
               <div className="p-6 overflow-y-auto space-y-6 bg-indigo-50/30 flex-1">
                   <div><h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2 uppercase text-sm">1. Escolha o Pão</h4>
                        <div className="flex flex-wrap gap-2">{configMontagem.paes.map(pao => (<button key={pao.id} onClick={() => setMontagem({...montagem, paoId: pao.id})} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${montagem.paoId == pao.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}>{pao.nome} {pao.valor > 0 && `(+${formatarMoeda(pao.valor)})`}</button>))}</div>
                   </div>
                   <div><h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2 uppercase text-sm">2. Queijo</h4>
                        <div className="flex flex-wrap gap-2">{configMontagem.queijos.map(item => (<button key={item.id} onClick={() => toggleMultiplo('queijoIds', item.id)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${montagem.queijoIds.includes(item.id) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'}`}>{item.nome} {item.valor > 0 && `(+${formatarMoeda(item.valor)})`}</button>))}</div>
                   </div>
                   <div><h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2 uppercase text-sm">3. Salsicha</h4>
                        <div className="flex flex-wrap gap-2">{configMontagem.salsichas.map(sal => (<button key={sal.id} onClick={() => setMontagem({...montagem, salsichaId: sal.id})} className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${montagem.salsichaId == sal.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}>{sal.nome} {sal.valor > 0 && `(+${formatarMoeda(sal.valor)})`}</button>))}</div>
                   </div>
                   <div><h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2 uppercase text-sm">4. Molhos</h4>
                        <div className="flex flex-wrap gap-2">{configMontagem.molhos.map(item => (<button key={item.id} onClick={() => toggleMultiplo('molhoIds', item.id)} className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${montagem.molhoIds.includes(item.id) ? 'bg-gray-800 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}>{item.nome}</button>))}</div>
                   </div>
                   <div><h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2 uppercase text-sm">5. Extras</h4>
                        <div className="flex flex-wrap gap-2">{configMontagem.adicionais.map(extra => (<button key={extra.id} onClick={() => toggleMultiplo('adicionalIds', extra.id)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${montagem.adicionalIds.includes(extra.id) ? 'bg-yellow-500 text-white border-yellow-600' : 'bg-white text-gray-600 border-gray-200'}`}>{extra.nome} {extra.valor > 0 && `(+${formatarMoeda(extra.valor)})`}</button>))}</div>
                   </div>
               </div>
               <div className="p-4 bg-white border-t border-indigo-100"><button onClick={concluirMontagem} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:scale-[1.02] transition-transform">ADICIONAR AO PEDIDO</button></div>
           </div>
        </div>
      )}

      {modalPedidoAberto && (<div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in"><div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-amber-100"><div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-5 flex justify-between items-center"><h3 className="font-extrabold text-xl flex items-center gap-2 italic">{formPedido.id ? 'Editar Dogão' : 'Novo Pedido'}</h3><button onClick={() => setModalPedidoAberto(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-6 bg-amber-50/50"><form onSubmit={salvarPedido} className="space-y-6"><Card className="p-5 border-red-100"><h4 className="font-bold text-red-800 mb-4 flex items-center gap-2 text-lg"><User size={20} className="text-red-500"/> Cliente</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{!formPedido.id && (<div className="md:col-span-2 bg-red-50 p-3 rounded-xl border border-red-100"><label className="text-xs font-bold text-red-700 uppercase mb-1 block">Buscar Salvo</label><select className="w-full border-2 border-red-200 rounded-lg p-2.5 bg-white" onChange={(e) => selecionarClienteNoPedido(e.target.value)} defaultValue=""><option value="">-- Selecione --</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>)}<div><label className="text-xs font-bold text-gray-500 uppercase">Nome</label><input required className={`w-full border-2 rounded-lg p-2.5 ${!formPedido.nome ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} value={formPedido.nome} onChange={e => setFormPedido({...formPedido, nome: e.target.value})}/></div><div><label className="text-xs font-bold text-gray-500 uppercase">Telefone</label><input className="w-full border-2 border-gray-200 rounded-lg p-2.5" value={formPedido.telefone} onChange={e => setFormPedido({...formPedido, telefone: e.target.value})}/></div><div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Endereço</label><input required className={`w-full border-2 rounded-lg p-2.5 ${!formPedido.endereco ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} value={formPedido.endereco} onChange={e => setFormPedido({...formPedido, endereco: e.target.value})}/></div></div></Card><Card className="p-5 border-yellow-200 bg-yellow-50/30"><h4 className="font-bold text-yellow-800 mb-4 flex items-center gap-2 text-lg"><Utensils size={20} className="text-yellow-600"/> Itens</h4><div className="space-y-3">{formPedido.itens.map((item, idx) => { const prodAtual = produtos.find(p => p.id == item.produtoId); const ehBebida = prodAtual?.categoria === 'Bebidas'; const ehAdicional = prodAtual?.categoria === 'Adicionais'; const ehCustom = item.produtoId === 999; 
                         const opcoesPossiveis = prodAtual?.opcoes ? prodAtual.opcoes.split(',') : [];
                         return (<div key={idx} className="bg-white p-4 rounded-xl border-2 border-yellow-100 shadow-sm relative"><div className="flex gap-2 items-start mb-3"><div className="w-20"><label className="text-[10px] uppercase font-bold text-gray-400">Qtd</label><input type="number" min="1" className="w-full border-2 border-gray-200 rounded-lg p-2 text-center font-black text-lg text-red-600" value={item.qtd} onChange={e => atualizarItem(idx, 'qtd', e.target.value)}/></div><div className="flex-1"><label className="text-[10px] uppercase font-bold text-gray-400">Produto</label>{ehCustom ? <div className="w-full border-2 border-indigo-200 bg-indigo-50 rounded-lg p-2.5 font-bold text-indigo-800">{item.nome} (R$ {item.preco})</div> : <select required className="w-full border-2 border-gray-200 rounded-lg p-2.5 bg-white font-bold text-gray-800" value={item.produtoId} onChange={e => atualizarItem(idx, 'produtoId', e.target.value)}><option value="">Selecione...</option>{Object.keys(produtos.reduce((acc, p) => {if(p.tipo!=='adicional' && p.id!==999) acc[p.categoria]=true; return acc},{})).map(cat => <optgroup key={cat} label={cat}>{produtos.filter(p => p.categoria === cat && p.tipo !== 'adicional' && p.id !== 999).map(p => <option key={p.id} value={p.id}>{p.categoria === 'Lanches' ? '🍔' : p.categoria === 'Bebidas' ? '🥤' : '🍱'} {p.nome}</option>)}</optgroup>)}</select>}</div></div>{item.produtoId && !ehCustom && (<div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mt-2 space-y-3">{opcoesPossiveis.length > 0 && (<div><label className="text-xs font-bold text-amber-700 uppercase block mb-1">Opções (Selecione)</label><div className="flex flex-wrap gap-2">{opcoesPossiveis.map(op => { const opClean = op.trim(); const selecionado = (item.opcoesSelecionadas || []).includes(opClean); return (<button type="button" key={opClean} onClick={() => toggleOpcaoItem(idx, opClean)} className={`text-xs px-3 py-1.5 rounded-full border transition-all font-bold ${selecionado ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300'}`}>{extrairNomeOpcao(opClean)} {extrairValorOpcao(opClean) > 0 ? `(+${formatarMoeda(extrairValorOpcao(opClean))})` : ''}</button>)})}</div></div>)}{!ehBebida && !ehAdicional && (<div><label className="text-xs font-bold text-amber-700 uppercase block mb-1">Adicionais</label><div className="flex flex-wrap gap-2">{produtos.filter(p => p.tipo === 'adicional').map(ad => (<button type="button" key={ad.id} onClick={() => toggleAdicionalItem(idx, ad.id)} className={`text-xs px-3 py-1.5 rounded-full border-2 transition-all font-bold ${item.listaAdicionais?.includes(ad.id) ? 'bg-red-500 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>{ad.nome} (+R$ {ad.preco})</button>))}</div></div>)}</div>)}{ehCustom && <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded border whitespace-pre-line">{item.opcaoSelecionada}</div>}{formPedido.itens.length > 1 && <button type="button" onClick={() => {const ni = formPedido.itens.filter((_, i) => i !== idx); setFormPedido({...formPedido, itens: ni})}} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>}</div>)})} <button type="button" onClick={() => setFormPedido({...formPedido, itens: [...formPedido.itens, { produtoId: '', nome: '', qtd: 1, preco: 0, opcaoSelecionada: '', listaAdicionais: [] }]})} className="w-full py-3 bg-white border-2 border-dashed border-yellow-300 text-yellow-700 font-bold rounded-xl hover:bg-yellow-50 flex justify-center items-center gap-2"><Plus size={18}/> ADICIONAR ITEM PADRÃO</button></div></Card><Card className="p-5 border-green-200 bg-green-50/30"><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div className="bg-white p-2 rounded-lg border border-green-100"><label className="text-[10px] font-bold text-green-700 uppercase mb-1 block">Taxa Entrega</label><div className="flex gap-1"><select className="flex-1 border border-gray-300 rounded-md py-1 px-2 text-sm" onChange={e => setFormPedido({...formPedido, taxaEntrega: e.target.value})} value={taxasFrete.some(t => t.valor == formPedido.taxaEntrega) ? formPedido.taxaEntrega : ''}><option value="0">Balcão</option>{taxasFrete.map(t => <option key={t.id} value={t.valor}>{t.nome}</option>)}<option value="">Outro</option></select><input type="number" className="w-16 border border-gray-300 rounded-md py-1 px-1 text-sm font-bold text-right" value={formPedido.taxaEntrega} onChange={e => setFormPedido({...formPedido, taxaEntrega: e.target.value})}/></div></div><div className="bg-white p-2 rounded-lg border border-green-100"><label className="text-[10px] font-bold text-green-700 uppercase mb-1 block">Pagamento</label><select className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm font-bold" value={formPedido.pagamento} onChange={e => setFormPedido({...formPedido, pagamento: e.target.value})}><option value="Dinheiro">💵 Dinheiro</option><option value="PIX">✨ PIX</option><option value="Cartão">💳 Cartão</option></select></div></div>{formPedido.pagamento === 'Dinheiro' && (<div className="mb-4 bg-green-100 p-3 rounded-xl border-2 border-green-200 flex items-center justify-between"><label className="text-xs font-bold text-green-800">Troco para:</label><input type="number" className="w-20 border-b-2 border-green-300 p-1 font-black text-sm text-green-800 bg-transparent focus:outline-none" placeholder="0,00" value={formPedido.trocoPara} onChange={e => setFormPedido({...formPedido, trocoPara: e.target.value})}/></div>)}<div className="mb-4"><label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 flex items-center gap-1"><Percent size={12}/> Desconto (%)</label><input type="number" className="w-full border-2 border-gray-200 rounded-lg p-2.5 font-bold" placeholder="0" value={formPedido.desconto} onChange={e => setFormPedido({...formPedido, desconto: e.target.value})}/></div><div><label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Obs. Gerais</label><textarea className="w-full border-2 border-gray-200 rounded-xl p-3 h-16 text-sm bg-white" value={formPedido.observacoes} onChange={e => setFormPedido({...formPedido, observacoes: e.target.value})}/></div></Card></form></div><div className="p-5 bg-white border-t-2 border-red-100 flex justify-between items-center"><div><span className="text-xs font-bold text-gray-500 uppercase">Total</span><div className="text-3xl font-black text-red-600">{formatarMoeda(calcularTotalPedido(formPedido.itens, formPedido.taxaEntrega, formPedido.desconto))}</div></div><button onClick={salvarPedido} className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-yellow-100 font-black py-4 px-10 rounded-full shadow-lg transition-all text-lg flex items-center gap-2">{formPedido.id ? 'SALVAR' : 'LANÇAR'}</button></div></div></div>)}
    </div>
  );
}

export default App;