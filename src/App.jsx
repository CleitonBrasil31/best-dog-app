import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, MapPin, User, CheckCircle, Utensils, Home,
  Plus, Trash2, X, Package, ClipboardList, Pencil, Settings, 
  Bike, MessageCircle, Map, DollarSign, Users, 
  ChefHat, TrendingUp, AlertCircle, Clock,
  Flame, UserPlus, Phone, Percent, Play, Calendar,
  Coffee, Star, ArrowRight, Edit3, CheckSquare, Square, Layers, Tag, Wand2,
  Moon, Sun, Image as ImageIcon, Loader2, Wifi, WifiOff
} from 'lucide-react';

// --- IMPORTAÇÃO SUPABASE ---
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO SUPABASE (COLE SUAS CHAVES AQUI) ---
const supabaseUrl = 'SUA_URL_SUPABASE'; 
const supabaseKey = 'SUA_CHAVE_ANON_PUBLIC';

// Inicializa o Supabase apenas se as chaves forem válidas
const hasSupabase = supabaseUrl !== 'SUA_URL_SUPABASE' && supabaseKey !== 'SUA_CHAVE_ANON_PUBLIC';
const supabase = hasSupabase ? createClient(supabaseUrl, supabaseKey) : null;

const SOM_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

// --- COMPONENTES VISUAIS ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 overflow-hidden transition-all duration-300 ${className}`}>{children}</div>
);

const Badge = ({ status }) => {
  const styles = {
    'Pendente': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Saiu para Entrega': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Concluido': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Cancelado': 'bg-zinc-700/50 text-zinc-400 border-zinc-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${styles[status] || styles['Pendente']} flex items-center gap-1 w-fit tracking-wide`}>
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
  
  // Modais
  const [modalPedidoAberto, setModalPedidoAberto] = useState(false);
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [modalMonteDogAberto, setModalMonteDogAberto] = useState(false);
  
  const [loading, setLoading] = useState(true);

  // --- DADOS (Inicia com arrays vazios para evitar quebra) ---
  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [taxasFrete, setTaxasFrete] = useState([]);
  const [montagemItens, setMontagemItens] = useState([]);

  // --- CONFIGURAÇÕES ---
  const [darkMode, setDarkMode] = useState(true); 
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('bd_logo_url') || '');
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0]);

  // --- AUXILIARES DE FORMULÁRIO ---
  const [novaTaxa, setNovaTaxa] = useState({ nome: '', valor: '' });
  const [novoItemMontagem, setNovoItemMontagem] = useState({ categoria: 'paes', nome: '', valor: '' });

  // --- INICIALIZAÇÃO ---
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => { localStorage.setItem('bd_logo_url', logoUrl); }, [logoUrl]);

  // --- CARREGAMENTO DE DADOS (HÍBRIDO: SUPABASE OU LOCALSTORAGE) ---
  const fetchDados = async () => {
      try {
          if (!hasSupabase) {
              // MODO OFFLINE (LOCALSTORAGE)
              const lsProdutos = JSON.parse(localStorage.getItem('bd_v50_produtos')) || [{id:1, nome:'Dog Simples', preco:15, categoria:'Lanches', tipo:'principal', estoque: 100}];
              const lsClientes = JSON.parse(localStorage.getItem('bd_v50_clientes')) || [];
              const lsTaxas = JSON.parse(localStorage.getItem('bd_v50_taxas')) || [{id:1, nome:'Centro', valor:5}];
              const lsPedidos = JSON.parse(localStorage.getItem('bd_v50_pedidos')) || [];
              const lsMontagem = JSON.parse(localStorage.getItem('bd_v50_montagem')) || [];
              
              setProdutos(lsProdutos);
              setClientes(lsClientes);
              setTaxasFrete(lsTaxas);
              setPedidos(lsPedidos);
              setMontagemItens(lsMontagem);
          } else {
              // MODO ONLINE (SUPABASE)
              const [p, c, t, m, ped] = await Promise.all([
                  supabase.from('produtos').select('*'),
                  supabase.from('clientes').select('*'),
                  supabase.from('taxas').select('*'),
                  supabase.from('montagem_itens').select('*'),
                  supabase.from('pedidos').select('*').order('id', { ascending: false })
              ]);

              if(p.data) setProdutos(p.data);
              if(c.data) setClientes(c.data);
              if(t.data) setTaxasFrete(t.data);
              if(m.data) setMontagemItens(m.data);
              if(ped.data) setPedidos(ped.data);
          }
      } catch (error) {
          console.error("Erro ao carregar dados:", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchDados();
      // Realtime apenas se tiver supabase
      if(hasSupabase) {
        const canal = supabase.channel('geral')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchDados())
            .subscribe();
        return () => supabase.removeChannel(canal);
      }
  }, []);

  // --- HELPERS ---
  const formatarMoeda = (v) => Number(v||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const tocarSom = () => { try { document.getElementById('audio-alerta')?.play().catch(()=>{}); } catch(e){} };

  // --- CONFIG MONTAGEM (COMPUTADA) ---
  const configMontagem = useMemo(() => {
      const itensSeguros = montagemItens || []; // Proteção contra null
      return {
          paes: itensSeguros.filter(i => i.categoria === 'paes'),
          queijos: itensSeguros.filter(i => i.categoria === 'queijos'),
          salsichas: itensSeguros.filter(i => i.categoria === 'salsichas'),
          molhos: itensSeguros.filter(i => i.categoria === 'molhos'),
          adicionais: itensSeguros.filter(i => i.categoria === 'adicionais'),
      };
  }, [montagemItens]);

  // --- FORMULÁRIOS INICIAIS ---
  const getFormPedidoInicial = () => ({ 
      id: null, nome: '', endereco: '', telefone: '', taxaEntrega: 0, pagamento: 'Dinheiro', trocoPara: '', observacoes: '', desconto: 0, 
      itens: [{ produtoId: '', nome: '', qtd: 1, preco: 0, opcoesSelecionadas: [], listaAdicionais: [] }] 
  });
  const [formPedido, setFormPedido] = useState(getFormPedidoInicial());
  const [formProduto, setFormProduto] = useState({ nome: '', descricao: '', preco: '', estoque: '', opcoes: '', tipo: 'principal', categoria: 'Lanches' });
  const [formCliente, setFormCliente] = useState({ nome: '', telefone: '', endereco: '', obs: '' });
  const [montagem, setMontagem] = useState({ paoId: '', salsichaId: '', queijoIds: [], molhoIds: [], adicionalIds: [] });

  // --- FUNÇÕES LÓGICAS DE CÁLCULO ---
  const extrairValorOpcao = (txt) => { if (!txt || !txt.includes('=+')) return 0; return parseFloat(txt.split('=+')[1]) || 0; };
  const extrairNomeOpcao = (txt) => { if (!txt) return ''; return txt.split('=+')[0].trim(); };
  
  const calcularTotal = (itens, entrega, desc) => {
      const subtotal = (itens || []).reduce((acc, item) => {
          if(!item.produtoId) return acc;
          const base = Number(item.preco || 0);
          const ops = (item.opcoesSelecionadas || []).reduce((s, o) => s + extrairValorOpcao(o), 0);
          const adds = (item.listaAdicionais || []).reduce((s, aid) => {
              const p = produtos.find(x => x.id === aid);
              return s + (p ? Number(p.preco) : 0);
          }, 0);
          return acc + ((base + ops + adds) * Number(item.qtd));
      }, 0);
      return (subtotal - (subtotal * (Number(desc)/100))) + Number(entrega);
  };

  // --- SALVAR PEDIDO (HÍBRIDO) ---
  const salvarPedido = async (e) => {
      e.preventDefault();
      const itensValidos = formPedido.itens.filter(i => i.produtoId);
      if (itensValidos.length === 0) return alert("Adicione itens!");
      if (!formPedido.nome) return alert("Nome obrigatório!");

      const payload = {
          cliente: { nome: formPedido.nome, endereco: formPedido.endereco, telefone: formPedido.telefone },
          itens: itensValidos,
          total: calcularTotal(itensValidos, formPedido.taxaEntrega, formPedido.desconto),
          taxa_entrega: Number(formPedido.taxaEntrega),
          pagamento: formPedido.pagamento,
          troco_para: Number(formPedido.trocoPara),
          desconto: Number(formPedido.desconto),
          observacoes: formPedido.observacoes,
          data: formPedido.id ? formPedido.data : getDataHoje(), 
          hora: formPedido.id ? formPedido.hora : new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
          status: formPedido.id ? formPedido.status : 'Pendente'
      };

      try {
        if(hasSupabase) {
            if(formPedido.id) await supabase.from('pedidos').update(payload).eq('id', formPedido.id);
            else { await supabase.from('pedidos').insert([payload]); tocarSom(); }
        } else {
            // OFFLINE
            const novos = formPedido.id 
                ? pedidos.map(p => p.id === formPedido.id ? {...payload, id: p.id} : p) 
                : [...pedidos, {...payload, id: Date.now()}];
            setPedidos(novos); 
            localStorage.setItem('bd_v50_pedidos', JSON.stringify(novos));
            if(!formPedido.id) tocarSom();
        }
        setModalPedidoAberto(false);
      } catch (err) {
        alert("Erro ao salvar pedido: " + err.message);
      }
  };

  // --- MONTE SEU DOG LÓGICA ---
  const concluirMontagem = () => {
      const pao = configMontagem.paes.find(p => p.id == montagem.paoId) || {nome: 'Pão Padrão', valor: 0};
      const salsicha = configMontagem.salsichas.find(s => s.id == montagem.salsichaId) || {nome: 'Tradicional', valor: 0};
      let totalExtras = 0;
      let detalhes = [`> ${pao.nome} ${pao.valor>0?`(+${formatarMoeda(pao.valor)})`:''}`, `> ${salsicha.nome} ${salsicha.valor>0?`(+${formatarMoeda(salsicha.valor)})`:''}`];
      
      const addDetalhe = (id, lista) => {
          const item = lista.find(x => x.id == id);
          if(item) { totalExtras += item.valor; detalhes.push(`+ ${item.nome} ${item.valor>0?`(+${formatarMoeda(item.valor)})`:''}`); }
      };

      montagem.queijoIds.forEach(id => addDetalhe(id, configMontagem.queijos));
      montagem.molhoIds.forEach(id => addDetalhe(id, configMontagem.molhos));
      montagem.adicionalIds.forEach(id => addDetalhe(id, configMontagem.adicionais));

      const precoFinal = parseFloat((15.00 + pao.valor + salsicha.valor + totalExtras).toFixed(2));
      const itemMontado = { produtoId: 999, nome: 'Dog Montado', preco: precoFinal, qtd: 1, opcoesSelecionadas: [detalhes.join('\n')], listaAdicionais: [] };
      
      const itensAtuais = formPedido.itens.filter(i => i.produtoId);
      setFormPedido({...formPedido, itens: [...itensAtuais, itemMontado]});
      setModalMonteDogAberto(false);
      setModalPedidoAberto(true);
  };

  // --- CRUD PRODUTOS (Híbrido) ---
  const salvarProduto = async (e) => {
      e.preventDefault();
      let tipo = formProduto.categoria === 'Adicionais' ? 'adicional' : 'principal';
      const dados = { 
          nome: formProduto.nome, 
          descricao: formProduto.descricao,
          preco: Number(formProduto.preco), 
          estoque: Number(formProduto.estoque),
          categoria: formProduto.categoria,
          tipo: tipo,
          opcoes: formProduto.opcoes 
      };

      if(hasSupabase) {
          if(formProduto.id) await supabase.from('produtos').update(dados).eq('id', formProduto.id);
          else await supabase.from('produtos').insert([dados]);
      } else {
          const novos = formProduto.id ? produtos.map(p => p.id === formProduto.id ? {...dados, id: p.id} : p) : [...produtos, {...dados, id: Date.now()}];
          setProdutos(novos); localStorage.setItem('bd_v50_produtos', JSON.stringify(novos));
      }
      setModalProdutoAberto(false);
  };

  const excluirProduto = async (id) => { 
      if(!confirm("Excluir?")) return;
      if(hasSupabase) await supabase.from('produtos').delete().eq('id', id);
      else {
          const novos = produtos.filter(i => i.id !== id);
          setProdutos(novos); localStorage.setItem('bd_v50_produtos', JSON.stringify(novos));
      }
  };

  // --- CRUD CLIENTES (Híbrido) ---
  const salvarCliente = async (e) => {
      e.preventDefault();
      const dados = { nome: formCliente.nome, telefone: formCliente.telefone, endereco: formCliente.endereco, obs: formCliente.obs };
      if(hasSupabase) {
          if(formCliente.id) await supabase.from('clientes').update(dados).eq('id', formCliente.id);
          else await supabase.from('clientes').insert([dados]);
      } else {
          const novos = formCliente.id ? clientes.map(c => c.id === formCliente.id ? {...dados, id: c.id} : c) : [...clientes, {...dados, id: Date.now()}];
          setClientes(novos); localStorage.setItem('bd_v50_clientes', JSON.stringify(novos));
      }
      setModalClienteAberto(false);
  };

  const excluirCliente = async (id) => { 
      if(!confirm("Excluir?")) return;
      if(hasSupabase) await supabase.from('clientes').delete().eq('id', id);
      else {
          const novos = clientes.filter(c => c.id !== id);
          setClientes(novos); localStorage.setItem('bd_v50_clientes', JSON.stringify(novos));
      }
  };

  // --- CRUD TAXAS & MONTAGEM (Híbrido) ---
  const salvarTaxa = async (e) => {
      e.preventDefault();
      const dados = { nome: novaTaxa.nome, valor: parseFloat(novaTaxa.valor) };
      if(hasSupabase) {
          await supabase.from('taxas').insert([dados]);
      } else {
          const novos = [...taxasFrete, { ...dados, id: Date.now() }];
          setTaxasFrete(novos); localStorage.setItem('bd_v50_taxas', JSON.stringify(novos));
      }
      setNovaTaxa({ nome: '', valor: '' });
  };
  
  const excluirTaxa = async (id) => { 
      if(hasSupabase) await supabase.from('taxas').delete().eq('id', id);
      else {
          const novos = taxasFrete.filter(t => t.id !== id);
          setTaxasFrete(novos); localStorage.setItem('bd_v50_taxas', JSON.stringify(novos));
      }
  };

  const adicionarItemConfig = async () => { 
      if (!novoItemMontagem.nome) return; 
      const dados = { 
          categoria: novoItemMontagem.categoria, 
          nome: novoItemMontagem.nome, 
          valor: parseFloat(novoItemMontagem.valor || 0) 
      };
      if(hasSupabase) {
          await supabase.from('montagem_itens').insert([dados]);
      } else {
          const novos = [...montagemItens, { ...dados, id: Date.now() }];
          setMontagemItens(novos); localStorage.setItem('bd_v50_montagem', JSON.stringify(novos));
      }
      setNovoItemMontagem({ ...novoItemMontagem, nome: '', valor: '' }); 
  };

  const removerItemConfig = async (id) => { 
      if(hasSupabase) await supabase.from('montagem_itens').delete().eq('id', id);
      else {
          const novos = montagemItens.filter(i => i.id !== id);
          setMontagemItens(novos); localStorage.setItem('bd_v50_montagem', JSON.stringify(novos));
      }
  };

  const avançarStatus = async (id) => {
      const pedido = pedidos.find(p => p.id === id);
      if(!pedido) return;
      let novo = pedido.status === 'Pendente' ? 'Saiu para Entrega' : 'Concluido';
      
      if(hasSupabase) {
          await supabase.from('pedidos').update({ status: novo }).eq('id', id);
          // Lógica simples de estoque no supabase
          if(novo === 'Concluido') {
              pedido.itens.forEach(async i => {
                  if(i.produtoId === 999) return;
                  const p = produtos.find(x => x.id === i.produtoId);
                  if(p) await supabase.from('produtos').update({ estoque: Math.max(0, p.estoque - i.qtd) }).eq('id', p.id);
              });
          }
      } else {
          const novos = pedidos.map(p => p.id === id ? {...p, status: novo} : p);
          setPedidos(novos); localStorage.setItem('bd_v50_pedidos', JSON.stringify(novos));
      }
      
      if(novo === 'Saiu para Entrega') setTimeout(() => enviarZap({...pedido, status: novo}), 100);
  };

  const cancelarPedido = async (id) => { 
      if(!confirm("Cancelar?")) return;
      if(hasSupabase) await supabase.from('pedidos').update({ status: 'Cancelado' }).eq('id', id);
      else {
          const novos = pedidos.map(p => p.id === id ? {...p, status: 'Cancelado'} : p);
          setPedidos(novos); localStorage.setItem('bd_v50_pedidos', JSON.stringify(novos));
      }
  };

  // --- FILTROS ---
  const pedidosFiltrados = useMemo(() => pedidos.filter(p => p.data === filtroData), [pedidos, filtroData]);
  const pedidosPendentes = useMemo(() => pedidos.filter(p => p.status !== 'Concluido' && p.status !== 'Cancelado'), [pedidos]);
  const kpis = useMemo(() => {
      const concluidos = pedidosFiltrados.filter(p => p.status === 'Concluido');
      const total = concluidos.reduce((acc, p) => acc + (p.total || 0), 0);
      return { total, qtd: concluidos.length, ticket: concluidos.length ? total / concluidos.length : 0 };
  }, [pedidosFiltrados]);

  // --- UI HELPERS ---
  const abrirNovoPedido = () => { setFormPedido(getFormPedidoInicial()); setModalPedidoAberto(true); };
  const abrirMonteDog = () => { 
      setFormPedido(getFormPedidoInicial()); 
      const pId = configMontagem.paes?.[0]?.id; 
      const sId = configMontagem.salsichas?.[0]?.id; 
      setMontagem({ paoId: pId, salsichaId: sId, queijoIds: [], molhoIds: [], adicionalIds: [] }); 
      setModalMonteDogAberto(true); 
  };
  const abrirNovoProduto = () => { setFormProduto({ nome:'', descricao:'', preco:'', estoque:'', opcoes:'', tipo:'principal', categoria:'Lanches' }); setModalProdutoAberto(true); };
  const abrirNovoCliente = () => { setFormCliente({ nome:'', telefone:'', endereco:'', obs:'' }); setModalClienteAberto(true); };

  const editarPedido = (p) => { setFormPedido({...p, itens: p.itens || [], clienteId: null, taxaEntrega: p.taxa_entrega, trocoPara: p.troco_para }); setModalPedidoAberto(true); }; 
  const editarCliente = (c) => { setFormCliente(c); setModalClienteAberto(true); };
  const editarProduto = (p) => { setFormProduto(p); setModalProdutoAberto(true); };
  
  const selecionarClienteNoPedido = (id) => { const c = clientes.find(x => x.id == id); if(c) setFormPedido({...formPedido, clienteId: c.id, nome: c.nome, endereco: c.endereco, telefone: c.telefone, taxaEntrega: 0}); };
  const atualizarItem = (idx, f, v) => { const ns = [...formPedido.itens]; ns[idx][f] = v; if(f === 'produtoId') { const p = produtos.find(x => x.id == v); if(p) { ns[idx].nome = p.nome; ns[idx].preco = p.preco; ns[idx].opcoesSelecionadas = []; ns[idx].listaAdicionais = []; } } setFormPedido({...formPedido, itens: ns}); };
  const toggleAdicionalItem = (idx, id) => { const ns = [...formPedido.itens]; const l = ns[idx].listaAdicionais || []; ns[idx].listaAdicionais = l.includes(id) ? l.filter(x => x !== id) : [...l, id]; setFormPedido({...formPedido, itens: ns}); };
  const toggleOpcaoItem = (idx, opcao) => { const ns = [...formPedido.itens]; const atuais = ns[idx].opcoesSelecionadas || []; if (atuais.includes(opcao)) { ns[idx].opcoesSelecionadas = atuais.filter(o => o !== opcao); } else { ns[idx].opcoesSelecionadas = [...atuais, opcao]; } setFormPedido({...formPedido, itens: ns}); };
  const toggleMultiplo = (campo, id) => { const lista = montagem[campo]; setMontagem({ ...montagem, [campo]: lista.includes(id) ? lista.filter(i => i !== id) : [...lista, id] }); };

  const enviarZap = (p) => {
    let msgTroco = "";
    if(p.pagamento === 'Dinheiro' && p.troco_para) msgTroco = `\n💵 *Troco p/ ${formatarMoeda(p.troco_para)}* (Devolver: ${formatarMoeda(Number(p.troco_para) - p.total)})`;
    else if (p.pagamento !== 'Dinheiro') msgTroco = `\n💳 Levar Maquininha (${p.pagamento})`;
    const saudacao = p.status === 'Saiu para Entrega' ? `🛵 *SEU PEDIDO SAIU!*` : `Olá ${p.cliente?.nome || ''}! 🌭🔥`;
    const txt = `${saudacao}\n\n*PEDIDO #${p.id}*\n📍 ${p.cliente?.endereco || 'Balcão'}\n\n${p.itens.map(i => `${i.qtd}x ${i.nome}\n   ${(i.opcoesSelecionadas||[]).join('\n   ')}`).join('\n')}\n\n💰 *Total: ${formatarMoeda(p.total)}*${msgTroco}`;
    window.open(`https://wa.me/55${p.cliente?.telefone?.replace(/\D/g,'')}?text=${encodeURIComponent(txt)}`, '_blank');
  };
  const abrirNoMaps = (end) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(end)}`, '_blank');

  const imprimir = (p) => {
    const subtotal = calcularTotal(p.itens, 0, 0);
    const descontoVal = subtotal * ((p.desconto || 0) / 100);
    const totalFinal = (subtotal - descontoVal) + Number(p.taxa_entrega);
    const troco = p.troco_para ? Number(p.troco_para) - totalFinal : 0;

    const conteudoHtml = `<html><head><style>@page{margin:0;size:80mm auto}body{margin:0;padding:5px;font-family:'Courier New',monospace;font-size:12px;color:#000;width:72mm;background:#fff}.header{text-align:center;margin-bottom:10px;border-bottom:2px solid #000;padding-bottom:10px}.title{font-size:20px;font-weight:900;margin:0}.meta{font-size:12px;display:flex;justify-content:space-between;margin-top:5px;font-weight:bold}.section{margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed #000}.client-name{font-size:16px;font-weight:800;text-transform:uppercase}.client-address{font-size:14px;margin-top:4px;font-weight:600;line-height:1.2}.item-box{padding:6px 0;border-bottom:1px dotted #999}.item-header{font-size:13px;font-weight:800;display:flex;justify-content:space-between}.item-details{margin-top:2px;font-size:11px;color:#000;white-space:pre-wrap;line-height:1.2;padding-left:5px}.totals{margin-top:10px}.row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px}.total-final{font-size:24px;font-weight:900;text-align:right;border-top:2px solid #000;margin-top:10px;padding-top:5px}.payment{font-size:12px;border:1px solid #000;padding:5px;text-align:center;font-weight:800;margin-top:5px}.obs{background:#000;color:#fff;padding:5px;font-weight:bold;font-size:12px;text-align:center;margin-top:5px}.footer{text-align:center;margin-top:10px;font-size:10px;margin-bottom:20px}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body><div class="header"><div class="title">BEST DOG</div><div class="meta"><span>#${p.id}</span><span>${p.hora}</span></div></div><div class="section"><div class="client-name">${p.cliente?.nome||'CLIENTE BALCÃO'}</div><div class="client-address">${p.cliente?.endereco||'Retirada'}</div><div>${p.cliente?.telefone||''}</div></div><div class="section">${p.itens.map(i=>{const pBase=Number(i.preco||0);const pOpcoes=(i.opcoesSelecionadas||[]).reduce((s,op)=>s+extrairValorOpcao(op),0);const pAdics=i.listaAdicionais?i.listaAdicionais.reduce((s,adId)=>{const pr=produtos.find(x=>x.id===adId);return s+(pr?Number(pr.preco):0)},0):0;const totalItem=(pBase+pOpcoes+pAdics)*i.qtd;let detalhesTexto="";if(i.produtoId===999){detalhesTexto=i.opcoesSelecionadas?i.opcoesSelecionadas[0]:""}else{if(i.opcoesSelecionadas&&i.opcoesSelecionadas.length>0){i.opcoesSelecionadas.forEach(op=>detalhesTexto+=`> ${extrairNomeOpcao(op)}\n`)}if(i.listaAdicionais?.length>0)i.listaAdicionais.forEach(adId=>{const ad=produtos.find(x=>x.id===adId);if(ad)detalhesTexto+=`+ ${ad.nome} (${formatarMoeda(ad.preco)})\n`})}return `<div class="item-box"><div class="item-header"><span>${i.qtd}x ${i.nome.toUpperCase()}</span><span>${formatarMoeda(totalItem)}</span></div>${detalhesTexto?`<div class="item-details">${detalhesTexto}</div>`:''}</div>`}).join('')}</div>${p.observacoes?`<div class="obs">OBS: ${p.observacoes.toUpperCase()}</div>`:''}<div class="totals"><div class="row"><span>Subtotal</span><span>${formatarMoeda(subtotal)}</span></div>${p.desconto>0?`<div class="row"><span>Desc. (${p.desconto}%)</span><span>- ${formatarMoeda(descontoVal)}</span></div>`:''}<div class="row"><span>Entrega</span><span>${formatarMoeda(Number(p.taxa_entrega))}</span></div><div class="total-final">TOTAL: ${formatarMoeda(totalFinal)}</div><div class="payment">${p.pagamento}${p.pagamento==='Dinheiro'&&p.troco_para?`<br>Troco p/ ${formatarMoeda(p.troco_para)}<br>Devolver: ${formatarMoeda(troco)}`:''}</div></div><div class="footer">*** Obrigado pela preferência! ***</div></body></html>`;
    const win = window.open('', '_blank', 'width=400,height=600'); if(win){win.document.write(conteudoHtml);win.document.close();}else{alert("Pop-up bloqueado!");}
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-zinc-950 text-white"><Loader2 className="animate-spin mr-2"/> Carregando...</div>;

  return (
    <div className={`flex h-screen font-sans overflow-hidden ${darkMode ? 'dark bg-slate-900' : 'bg-amber-50'}`}>
      <audio id="audio-alerta" src={SOM_URL} />

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 dark:bg-black border-r border-slate-800 text-white shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">{logoUrl ? <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover ring-2 ring-slate-700"/> : <div className="bg-gradient-to-br from-yellow-500 to-red-600 p-2 rounded-xl shadow-lg transform -rotate-6"><Utensils size={24} className="text-white"/></div>}<div><h1 className="font-extrabold text-2xl tracking-tight italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">BEST DOG</h1><p className="text-xs text-slate-400 font-bold">Online v50.0</p></div></div>
        <nav className="flex-1 p-4 space-y-2">
           {[ { id: 'dashboard', icon: Home, label: 'Visão Geral' }, { id: 'montagem', icon: Layers, label: 'Monte seu Dog' }, { id: 'pedidos', icon: ClipboardList, label: 'Pedidos', count: pedidosPendentes.length }, { id: 'vendas', icon: DollarSign, label: 'Caixa & Gestão' }, { id: 'produtos', icon: Package, label: 'Cardápio' }, { id: 'clientes', icon: Users, label: 'Clientes' }, { id: 'config', icon: Settings, label: 'Configurações' }].map(item => (
             <button key={item.id} onClick={() => setAbaAtiva(item.id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-bold ${abaAtiva === item.id ? 'bg-gradient-to-r from-red-600/20 to-red-900/20 text-red-400 border border-red-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><div className="flex items-center gap-3"><item.icon size={20} className={abaAtiva === item.id ? 'text-yellow-300' : ''}/> <span>{item.label}</span></div>{item.id === 'pedidos' && item.count > 0 && <span className="bg-yellow-500 text-red-900 text-xs font-black px-2 py-0.5 rounded-full">{item.count}</span>}</button>
           ))}
        </nav>
        <div className="p-4 border-t border-slate-800 flex justify-center"><div className="flex items-center gap-2 text-sm text-yellow-400">{hasSupabase ? <><Wifi size={16}/> Online</> : <><WifiOff size={16}/> Offline (Local)</>}</div></div>
      </aside>

      <main className="flex-1 overflow-y-auto relative flex flex-col bg-amber-50/50 dark:bg-slate-900 transition-colors duration-300">
        <header className="md:hidden bg-slate-900 dark:bg-black text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-10 border-b border-zinc-800"><div className="flex items-center gap-2 font-extrabold italic text-xl">{logoUrl ? <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover"/> : <Utensils className="text-yellow-500"/>} BEST DOG</div><div className="flex gap-3 items-center">{pedidosPendentes.length > 0 && <span className="text-xs bg-red-600 text-yellow-100 font-bold px-3 py-1 rounded-full shadow-sm">{pedidosPendentes.length}</span>}</div></header>

        <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full"> </div>
            
            {/* DASHBOARD */}
            {abaAtiva === 'dashboard' && (
              <div className="space-y-4">
                 <button onClick={abrirNovoPedido} className="w-full bg-gradient-to-br from-red-600 to-orange-600 text-white py-5 rounded-2xl shadow-lg hover:from-red-500 hover:to-orange-500 transition transform active:scale-95 font-black text-xl md:text-2xl flex justify-center items-center gap-3 border border-red-500/30"><Plus size={32} strokeWidth={3} className="bg-white/20 rounded-full p-1"/> NOVO PEDIDO AGORA</button>
                 <button onClick={abrirMonteDog} className="w-full py-4 bg-indigo-600 dark:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md hover:bg-indigo-500 flex justify-center items-center gap-3 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all"><Edit3 size={22} className="text-yellow-300"/> MONTE SEU DOG</button>
                 <div className="mt-4">
                    <h3 className="font-extrabold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3 uppercase text-sm tracking-wider"><Flame size={18} className="text-orange-500"/> Fila de Produção ({pedidosPendentes.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{pedidosPendentes.length === 0 ? <div className="col-span-full text-center p-10 bg-white/50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-amber-200 dark:border-slate-700 text-gray-400 italic">Nenhum pedido na chapa...</div> : pedidosPendentes.map(p => (<div key={p.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-amber-100 dark:border-slate-700 flex flex-col relative overflow-hidden hover:border-zinc-700 transition-all"><div className={`h-1 w-full ${p.status === 'Saiu para Entrega' ? 'bg-orange-500' : 'bg-red-500'}`}></div><div className="p-3 flex flex-col gap-1"><div className="flex justify-between items-center"><span className="font-black text-gray-800 dark:text-white text-lg">#{p.id?.toString().slice(-4)}</span><div className="flex items-center gap-2"><button onClick={() => abrirNoMaps(p.cliente?.endereco || '')} className="text-blue-500 bg-blue-50 dark:bg-slate-700 p-1 rounded hover:bg-blue-100"><Map size={14}/></button><Badge status={p.status}/></div></div><div className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{p.cliente?.nome}</div><div className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Utensils size={10}/> {(p.itens||[]).length} itens • {p.hora}</div><div className="text-xs text-gray-600 dark:text-gray-400 bg-amber-50/50 dark:bg-slate-700/50 border-l-4 border-amber-300 dark:border-slate-600 pl-2 py-1 mb-2 font-medium">{(p.itens||[]).map(i => `${i.qtd}x ${i.nome}`).join(', ').substring(0, 60)}{p.itens?.length > 2 ? '...' : ''}</div><div className="flex justify-between items-end mt-auto pt-2 border-t border-gray-50 dark:border-slate-700"><div><div className="text-[10px] uppercase text-gray-400 font-bold">{p.pagamento}</div><div className="font-black text-red-600 dark:text-red-400 text-lg">{formatarMoeda(p.total)}</div></div><div className="flex gap-1"><button onClick={() => imprimir(p)} className="p-1.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-600"><Printer size={14}/></button><button onClick={() => enviarZap(p)} className="p-1.5 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded hover:bg-green-200"><MessageCircle size={14}/></button><button onClick={() => editarPedido(p)} className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded hover:bg-amber-200"><Pencil size={14}/></button></div></div></div><button onClick={() => avançarStatus(p.id)} className={`w-full py-2 text-xs font-bold text-white flex items-center justify-center gap-1 ${p.status === 'Pendente' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>{p.status === 'Pendente' ? <><ArrowRight size={14}/> MANDAR ENTREGA</> : <><CheckCircle size={14}/> CONCLUIR</>}</button></div>))}</div></div>
            )}

            {/* PEDIDOS COMPLETO */}
            {abaAtiva === 'pedidos' && <div className="space-y-4"><div className="flex justify-between items-center mb-2"><h2 className="text-xl font-bold text-gray-800 dark:text-white">Lista Detalhada</h2></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{pedidosPendentes.map(p => (<div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-amber-100 dark:border-slate-700 overflow-hidden p-5"><div className="flex justify-between"><strong className="dark:text-white">#{p.id?.toString().slice(-4)}</strong><Badge status={p.status}/></div><div className="mt-2"><p className="font-bold dark:text-gray-200">{p.cliente?.nome}</p><p className="text-xs text-gray-500">{p.cliente?.endereco}</p></div><div className="bg-gray-50 dark:bg-slate-700 p-2 rounded text-sm mt-2 dark:text-gray-300">{(p.itens||[]).map((i, idx) => (<div key={idx}>{i.qtd}x {i.nome}</div>))}</div><div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-gray-700"><span className="font-black text-red-600 dark:text-red-400">{formatarMoeda(p.total)}</span><div className="flex gap-2"><button onClick={() => editarPedido(p)} className="text-xs bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded dark:text-white">Editar</button><button onClick={() => cancelarPedido(p.id)} className="text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-1 rounded">Cancelar</button></div></div></div>))}</div></div>}

            {/* VENDAS */}
            {abaAtiva === 'vendas' && <div className="space-y-6 animate-fade-in"><div className="grid grid-cols-3 gap-2"><Card className="p-3"><span className="text-xs font-bold text-green-600">Faturamento</span><h3 className="text-xl font-black dark:text-white">{formatarMoeda(kpis.total)}</h3></Card><Card className="p-3"><span className="text-xs font-bold text-yellow-600">Pedidos</span><h3 className="text-xl font-black dark:text-white">{kpis.qtd}</h3></Card><Card className="p-3"><span className="text-xs font-bold text-red-500">Ticket Médio</span><h3 className="text-xl font-black dark:text-white">{formatarMoeda(kpis.ticket)}</h3></Card></div><div className="p-3 bg-white dark:bg-slate-800 rounded border dark:border-slate-700"><input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} className="dark:bg-slate-700 dark:text-white border p-1 rounded"/></div><Card className="p-0"><table className="w-full text-xs text-left dark:text-gray-300"><thead className="bg-gray-100 dark:bg-slate-700"><tr><th className="p-2">#</th><th className="p-2">Nome</th><th className="p-2 text-right">R$</th></tr></thead><tbody>{pedidosFiltrados.map(p => <tr key={p.id} className="border-b dark:border-slate-700"><td className="p-2">#{p.id?.toString().slice(-4)}</td><td className="p-2">{p.cliente?.nome}</td><td className="p-2 text-right">{formatarMoeda(p.total)}</td></tr>)}</tbody></table></Card></div>}

            {/* PRODUTOS */}
            {abaAtiva === 'produtos' && <div className="space-y-4"><div className="flex justify-between"><h2 className="font-bold dark:text-white">Cardápio</h2><button onClick={abrirNovoProduto} className="bg-black dark:bg-white dark:text-black text-white px-3 py-1 rounded text-xs font-bold">Add</button></div><div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{['Lanches','Bebidas','Combos','Adicionais'].map(c => <button key={c} onClick={() => setFiltroCardapio(c)} className={`px-3 py-1 rounded-full text-xs border ${filtroCardapio===c?'bg-red-600 text-white border-red-600':'bg-white dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600 text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{c}</button>)}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{produtos.filter(p => {if(filtroCardapio==='Adicionais')return p.tipo==='adicional'; return p.categoria===filtroCardapio && p.tipo!=='adicional'}).map(p => <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700 flex justify-between items-center"><div><div className="font-bold text-sm dark:text-white">{p.nome}</div><div className="text-xs text-gray-500">{formatarMoeda(p.preco)}</div></div><div className="flex gap-2"><button onClick={() => {setFormProduto(p); setModalProdutoAberto(true)}} className="p-2 bg-gray-100 dark:bg-slate-700 rounded"><Pencil size={14} className="dark:text-white"/></button><button onClick={() => excluirProduto(p.id)} className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"><Trash2 size={14}/></button></div></div>)}</div></div>}
            
            {/* CLIENTES */}
            {abaAtiva === 'clientes' && <div className="space-y-4"><div className="flex justify-between"><h2 className="font-bold dark:text-white">Clientes</h2><button onClick={abrirNovoCliente} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">Add</button></div><div className="grid grid-cols-1 gap-2">{clientes.map(c => <div key={c.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border dark:border-slate-700 flex justify-between items-center"><div><div className="font-bold text-sm dark:text-white">{c.nome}</div><div className="text-xs text-gray-500">{c.telefone}</div></div><div className="flex gap-2"><button onClick={() => {setFormCliente(c); setModalClienteAberto(true)}}><Pencil size={14} className="dark:text-white"/></button><button onClick={() => excluirCliente(c.id)} className="text-red-500"><Trash2 size={14}/></button></div></div>)}</div></div>}
            
            {/* MONTAGEM */}
            {abaAtiva === 'montagem' && <div className="space-y-6 animate-fade-in"><div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-extrabold text-indigo-800 dark:text-indigo-400 italic flex items-center gap-2"><Layers/> Itens de Montagem</h2></div><Card className="p-4 bg-indigo-50 dark:bg-slate-700 border-indigo-200 dark:border-slate-600"><h4 className="font-bold text-indigo-800 dark:text-white text-sm mb-2">Cadastrar Opção</h4><div className="flex gap-2 mb-2"><select className="border rounded p-2 text-xs w-32 dark:bg-slate-800 dark:text-white dark:border-slate-600" value={novoItemMontagem.categoria} onChange={e => setNovoItemMontagem({...novoItemMontagem, categoria: e.target.value})}><option value="paes">Pães</option><option value="queijos">Queijos</option><option value="salsichas">Salsichas</option><option value="molhos">Molhos</option><option value="adicionais">Adicionais</option></select><input placeholder="Nome" className="flex-1 border rounded p-2 text-xs dark:bg-slate-800 dark:text-white dark:border-slate-600" value={novoItemMontagem.nome} onChange={e => setNovoItemMontagem({...novoItemMontagem, nome: e.target.value})}/><input placeholder="R$" type="number" className="w-20 border rounded p-2 text-xs dark:bg-slate-800 dark:text-white dark:border-slate-600" value={novoItemMontagem.valor} onChange={e => setNovoItemMontagem({...novoItemMontagem, valor: e.target.value})}/><button onClick={adicionarItemConfig} className="bg-indigo-600 text-white px-3 rounded text-xs font-bold">Salvar</button></div></Card><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[{key:'paes',t:'Pães'},{key:'queijos',t:'Queijos'},{key:'salsichas',t:'Salsichas'},{key:'molhos',t:'Molhos'},{key:'adicionais',t:'Adicionais'}].map(g=><Card key={g.key} className="p-4 border-gray-200 dark:border-slate-700"><h5 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase mb-2 border-b pb-1 dark:border-slate-600">{g.t}</h5><div className="space-y-1">{(configMontagem[g.key]||[]).map(i=><div key={i.id} className="flex justify-between text-xs text-gray-700 dark:text-gray-300"><span>{i.nome}</span><span>{i.valor>0?`+${formatarMoeda(i.valor)}`:'Grátis'} <button onClick={()=>removerItemConfig(g.key,i.id)} className="text-red-500 ml-2">x</button></span></div>)}</div></Card>)}</div></div>}
            
            {/* CONFIG */}
            {abaAtiva === 'config' && (<div className="space-y-6"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-extrabold text-gray-800 dark:text-white italic flex items-center gap-2"><Settings className="text-gray-600 dark:text-gray-400"/> Configurações</h2></div><Card className="p-6 border-gray-200"><h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Áudio</h3><button onClick={tocarSom} className="px-4 py-2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-lg font-bold flex items-center gap-2 hover:bg-amber-200"><Play size={18} /> Testar Som</button></Card><Card className="p-6 border-gray-200"><h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Taxas de Entrega</h3><form onSubmit={salvarTaxa} className="flex gap-2 mb-6"><input placeholder="Descrição" required className="flex-1 border-2 border-gray-200 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white" value={novaTaxa.nome} onChange={e => setNovaTaxa({...novaTaxa, nome: e.target.value})}/><input placeholder="Valor" required type="number" step="0.50" className="w-24 border-2 border-gray-200 dark:border-slate-600 rounded-lg p-2 text-sm" value={novaTaxa.valor} onChange={e => setNovaTaxa({...novaTaxa, valor: e.target.value})}/><button type="submit" className="bg-green-600 text-white px-4 rounded-lg font-bold hover:bg-green-700"><Plus/></button></form><div className="space-y-2">{taxasFrete.map(t => (<div key={t.id} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700 p-3 rounded-lg border border-gray-100 dark:border-slate-600"><span className="text-sm text-gray-700 dark:text-white font-medium">{t.nome}</span><div className="flex items-center gap-3"><span className="font-bold text-green-600 dark:text-green-400">{formatarMoeda(t.valor)}</span><button onClick={() => excluirTaxa(t.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></div></div>))}</div></Card></div>)}
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

      {/* MODAIS (CÓDIGO COMPLETO AGORA) */}
      {modalProdutoAberto && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6"><h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">{formProduto.id ? 'Editar Produto' : 'Novo Produto'}</h3><form onSubmit={handleSaveProduto} className="space-y-4"><div><label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Nome</label><input required className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={formProduto.nome} onChange={e => setFormProduto({...formProduto, nome: e.target.value})}/></div><div><label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Descrição</label><textarea className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-lg p-2 h-16 dark:bg-slate-700 dark:text-white" value={formProduto.descricao} onChange={e => setFormProduto({...formProduto, descricao: e.target.value})}/></div><div className="flex gap-4"><div className="flex-1"><label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Preço</label><input required type="number" step="0.50" className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={formProduto.preco} onChange={e => setFormProduto({...formProduto, preco: e.target.value})}/></div><div className="flex-1"><label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Estoque</label><input type="number" className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={formProduto.estoque} onChange={e => setFormProduto({...formProduto, estoque: e.target.value})}/></div></div><div><label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Categoria</label><select className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 dark:text-white" value={formProduto.categoria} onChange={e => setFormProduto({...formProduto, categoria: e.target.value})}><option value="Lanches">Lanches</option><option value="Bebidas">Bebidas</option><option value="Combos">Combos</option><option value="Adicionais">Adicionais</option></select></div>{formProduto.categoria !== 'Adicionais' && formProduto.categoria !== 'Bebidas' && <div><label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Opções</label><textarea className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-lg p-2 h-20 text-sm dark:bg-slate-700 dark:text-white" value={formProduto.opcoes} onChange={e => setFormProduto({...formProduto, opcoes: e.target.value})}/></div>}<div className="flex justify-end gap-2 mt-4 pt-4 border-t dark:border-slate-700"><button type="button" onClick={() => setModalProdutoAberto(false)} className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button><button type="submit" className="px-6 py-2 bg-gray-800 dark:bg-white dark:text-black text-white font-bold rounded-lg hover:bg-black">Salvar</button></div></form></div></div>)}
      {modalClienteAberto && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6"><h3 className="font-bold text-xl mb-4 text-blue-800 dark:text-blue-400 flex items-center gap-2"><UserPlus size={24}/> {formCliente.id ? 'Editar Cliente' : 'Novo Cliente'}</h3><form onSubmit={handleSaveCliente} className="space-y-4"><div><label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Nome</label><input required className="w-full border-2 border-blue-100 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={formCliente.nome} onChange={e => setFormCliente({...formCliente, nome: e.target.value})}/></div><div><label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Telefone</label><input className="w-full border-2 border-blue-100 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={formCliente.telefone} onChange={e => setFormCliente({...formCliente, telefone: e.target.value})}/></div><div><label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Endereço</label><input required className="w-full border-2 border-blue-100 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-700 dark:text-white" value={formCliente.endereco} onChange={e => setFormCliente({...formCliente, endereco: e.target.value})}/></div><div className="flex justify-end gap-2 mt-4 pt-4 border-t dark:border-slate-700"><button type="button" onClick={() => setModalClienteAberto(false)} className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button><button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Salvar</button></div></form></div></div>)}
      {/* Outros modais de Pedido e Montagem já estavam presentes e foram mantidos na lógica acima */}
      {modalMonteDogAberto && (<div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-amber-100 dark:border-slate-700"><div className="bg-indigo-600 p-4 text-white font-black text-xl flex justify-between items-center shadow-sm"><div className="flex items-center gap-2"><Edit3/> MONTE SEU DOG</div><button onClick={() => setModalMonteDogAberto(false)} className="bg-white/20 p-1 rounded hover:bg-white/40"><X/></button></div><div className="p-6 overflow-y-auto space-y-6 bg-indigo-50/30 dark:bg-slate-900 flex-1"><div><h4 className="font-bold text-indigo-800 dark:text-indigo-400 mb-2 flex items-center gap-2 uppercase text-sm">1. Escolha o Pão</h4><div className="space-y-2">{(configMontagem.paes||[]).map(pao => (<label key={pao.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${montagem.paoId == pao.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-200'}`}><input type="radio" name="pao" className="accent-indigo-600 w-5 h-5" checked={montagem.paoId == pao.id} onChange={() => setMontagem({...montagem, paoId: pao.id})}/><span className="font-bold text-gray-700 dark:text-gray-200">{pao.nome} {pao.valor > 0 && <span className="text-indigo-600 text-xs">(+{formatarMoeda(pao.valor)})</span>}</span></label>))}</div></div><div><h4 className="font-bold text-indigo-800 dark:text-indigo-400 mb-2 flex items-center gap-2 uppercase text-sm">2. Queijo</h4><div className="grid grid-cols-2 gap-2">{(configMontagem.queijos||[]).map(item => (<label key={item.id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-sm ${montagem.queijoIds.includes(item.id) ? 'bg-emerald-900/20 border-emerald-600 text-emerald-300' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}><input type="checkbox" className="accent-emerald-500" checked={montagem.queijoIds.includes(item.id)} onChange={() => toggleMultiplo('queijoIds', item.id)}/><span className="flex-1 font-medium dark:text-gray-300">{item.nome}</span>{item.valor > 0 && <span className="font-bold text-emerald-600">+{item.valor}</span>}</label>))}</div></div><div><h4 className="font-bold text-indigo-800 dark:text-indigo-400 mb-2 flex items-center gap-2 uppercase text-sm">3. Salsicha</h4><div className="space-y-2">{(configMontagem.salsichas||[]).map(sal => (<label key={sal.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${montagem.salsichaId == sal.id ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800'}`}><input type="radio" name="salsicha" className="accent-indigo-600 w-5 h-5" checked={montagem.salsichaId == sal.id} onChange={() => setMontagem({...montagem, salsichaId: sal.id})}/><span className="font-bold text-gray-700 dark:text-gray-200 text-sm">{sal.nome} {sal.valor > 0 && <span className="text-indigo-600 text-xs">(+{formatarMoeda(sal.valor)})</span>}</span></label>))}</div></div><div><h4 className="font-bold text-indigo-800 dark:text-indigo-400 mb-2 flex items-center gap-2 uppercase text-sm">4. Molhos</h4><div className="flex flex-wrap gap-2">{(configMontagem.molhos||[]).map(item => (<label key={item.id} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-xs font-bold ${montagem.molhoIds.includes(item.id) ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'}`}><input type="checkbox" className="hidden" checked={montagem.molhoIds.includes(item.id)} onChange={() => toggleMultiplo('molhoIds', item.id)}/>{item.nome}</label>))}</div></div><div><h4 className="font-bold text-indigo-800 dark:text-indigo-400 mb-2 flex items-center gap-2 uppercase text-sm">5. Extras</h4><div className="space-y-2">{(configMontagem.adicionais||[]).map(extra => (<label key={extra.id} className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${montagem.adicionalIds.includes(extra.id) ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800'}`}><div className="flex items-center gap-2"><input type="checkbox" className="accent-yellow-500 w-5 h-5" checked={montagem.adicionalIds.includes(extra.id)} onChange={() => toggleMultiplo('adicionalIds', extra.id)}/><span className={`font-bold text-sm ${montagem.adicionalIds.includes(extra.id) ? 'text-yellow-600 dark:text-yellow-200' : 'text-gray-700 dark:text-gray-300'}`}>{extra.nome}</span></div><span className="font-bold text-sm text-yellow-600 dark:text-yellow-500">+ {formatarMoeda(extra.valor)}</span></label>))}</div></div></div><div className="p-4 bg-white dark:bg-slate-900 border-t border-indigo-100 dark:border-slate-700"><button onClick={concluirMontagem} className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:scale-[1.02] transition-transform border border-indigo-500/50">ADICIONAR AO PEDIDO</button></div></div></div>)}
      {modalPedidoAberto && (<div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in"><div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-amber-100 dark:border-slate-700"><div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-5 flex justify-between items-center"><h3 className="font-extrabold text-xl flex items-center gap-2 italic">{formPedido.id ? 'Editar Dogão' : 'Novo Pedido'}</h3><button onClick={() => setModalPedidoAberto(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-6 bg-amber-50/50 dark:bg-slate-900/50"><form onSubmit={salvarPedido} className="space-y-6"><Card className="p-5 border-red-100 dark:border-red-900/30"><h4 className="font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2 text-lg"><User size={20} className="text-red-500"/> Cliente</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{!formPedido.id && (<div className="md:col-span-2 bg-red-50 dark:bg-red-900/30 p-3 rounded-xl border border-red-100 dark:border-red-800"><label className="text-xs font-bold text-red-700 dark:text-red-300 uppercase mb-1 block">Buscar Salvo</label><select className="w-full border-2 border-red-200 dark:border-red-700 rounded-lg p-2.5 bg-white dark:bg-slate-700 dark:text-white" onChange={(e) => selecionarClienteNoPedido(e.target.value)} defaultValue=""><option value="">-- Selecione --</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>)}<div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Nome</label><input required className={`w-full border-2 rounded-lg p-2.5 dark:bg-slate-700 dark:text-white ${!formPedido.nome ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-slate-600'}`} value={formPedido.nome} onChange={e => setFormPedido({...formPedido, nome: e.target.value})}/></div><div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Telefone</label><input className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-lg p-2.5 dark:bg-slate-700 dark:text-white" value={formPedido.telefone} onChange={e => setFormPedido({...formPedido, telefone: e.target.value})}/></div><div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Endereço</label><input required className={`w-full border-2 rounded-lg p-2.5 dark:bg-slate-700 dark:text-white ${!formPedido.endereco ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-slate-600'}`} value={formPedido.endereco} onChange={e => setFormPedido({...formPedido, endereco: e.target.value})}/></div></div></Card><Card className="p-5 border-yellow-200 bg-yellow-50/30 dark:bg-yellow-900/20 dark:border-yellow-800"><h4 className="font-bold text-yellow-800 dark:text-yellow-400 mb-4 flex items-center gap-2 text-lg"><Utensils size={20} className="text-yellow-600"/> Itens</h4><div className="space-y-3">{formPedido.itens.map((item, idx) => { const prodAtual = produtos.find(p => p.id == item.produtoId); const ehCustom = item.produtoId === 999; const opcoesPossiveis = prodAtual?.opcoes ? prodAtual.opcoes.split(',') : []; return (<div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-yellow-100 dark:border-slate-600 shadow-sm relative"><div className="flex gap-2 items-start mb-3"><div className="w-20"><label className="text-[10px] uppercase font-bold text-gray-400">Qtd</label><input type="number" min="1" className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-lg p-2 text-center font-black text-lg text-red-600 dark:bg-slate-700 dark:text-red-400" value={item.qtd} onChange={e => atualizarItem(idx, 'qtd', e.target.value)}/></div><div className="flex-1"><label className="text-[10px] uppercase font-bold text-gray-400">Produto</label>{ehCustom ? <div className="w-full border-2 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-800 rounded-lg p-2.5 font-bold text-indigo-800 dark:text-indigo-300">{item.nome} (R$ {item.preco})</div> : <select required className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 font-bold text-gray-800 dark:text-white" value={item.produtoId} onChange={e => atualizarItem(idx, 'produtoId', e.target.value)}><option value="">Selecione...</option>{Object.keys(produtos.reduce((acc, p) => {if(p.tipo!=='adicional' && p.id!==999) acc[p.categoria]=true; return acc},{})).map(cat => <optgroup key={cat} label={cat}>{produtos.filter(p => p.categoria === cat && p.tipo !== 'adicional' && p.id !== 999).map(p => <option key={p.id} value={p.id}>{p.categoria === 'Lanches' ? '🍔' : p.categoria === 'Bebidas' ? '🥤' : '🍱'} {p.nome}</option>)}</optgroup>)}</select>}</div></div>{item.produtoId && !ehCustom && (<div className="bg-amber-50 dark:bg-slate-700/50 p-3 rounded-lg border border-amber-100 dark:border-slate-600 mt-2 space-y-3">{opcoesPossiveis.length > 0 && (<div><label className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase block mb-1">Opções (Selecione)</label><div className="flex flex-wrap gap-2">{opcoesPossiveis.map(op => { const opClean = op.trim(); const selecionado = (item.opcoesSelecionadas || []).includes(opClean); return (<button type="button" key={opClean} onClick={() => toggleOpcaoItem(idx, opClean)} className={`text-xs px-3 py-1.5 rounded-full border transition-all font-bold ${selecionado ? 'bg-orange-500 text-white border-orange-600' : 'bg-white dark:bg-slate-600 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-slate-500'}`}>{extrairNomeOpcao(opClean)} {extrairValorOpcao(opClean) > 0 ? `(+${formatarMoeda(extrairValorOpcao(opClean))})` : ''}</button>)})}</div></div>)}{prodAtual?.categoria !== 'Bebidas' && (<div><label className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase block mb-1">Adicionais</label><div className="flex flex-wrap gap-2">{produtos.filter(p => p.tipo === 'adicional').map(ad => (<button type="button" key={ad.id} onClick={() => toggleAdicionalItem(idx, ad.id)} className={`text-xs px-3 py-1.5 rounded-full border-2 transition-all font-bold ${item.listaAdicionais?.includes(ad.id) ? 'bg-red-500 border-red-600 text-white' : 'bg-white dark:bg-slate-600 border-gray-200 dark:border-slate-500 text-gray-600 dark:text-gray-300'}`}>{ad.nome} (+R$ {ad.preco})</button>))}</div></div>)}</div>)}{ehCustom && <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded border whitespace-pre-line">{item.opcoesSelecionadas[0]}</div>}{formPedido.itens.length > 1 && <button type="button" onClick={() => {const ni = formPedido.itens.filter((_, i) => i !== idx); setFormPedido({...formPedido, itens: ni})}} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>}</div>)})} <button type="button" onClick={() => setFormPedido({...formPedido, itens: [...formPedido.itens, { produtoId: '', nome: '', qtd: 1, preco: 0, opcoesSelecionadas: [], listaAdicionais: [] }]})} className="w-full py-3 bg-white dark:bg-slate-700 border-2 border-dashed border-yellow-300 text-yellow-700 dark:text-yellow-400 font-bold rounded-xl hover:bg-yellow-50 flex justify-center items-center gap-2"><Plus size={18}/> ADICIONAR ITEM PADRÃO</button></div></Card><Card className="p-5 border-green-200 bg-green-50/30 dark:bg-green-900/20 dark:border-green-800"><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-green-100 dark:border-slate-600"><label className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase mb-1 block">Taxa Entrega</label><div className="flex gap-1"><select className="flex-1 border border-gray-300 dark:border-slate-600 rounded-md py-1 px-2 text-sm dark:bg-slate-700 dark:text-white" onChange={e => setFormPedido({...formPedido, taxaEntrega: e.target.value})} value={taxasFrete.some(t => t.valor == formPedido.taxaEntrega) ? formPedido.taxaEntrega : ''}><option value="0">Balcão</option>{taxasFrete.map(t => <option key={t.id} value={t.valor}>{t.nome}</option>)}<option value="">Outro</option></select><input type="number" className="w-16 border border-gray-300 dark:border-slate-600 rounded-md py-1 px-1 text-sm font-bold text-right dark:bg-slate-700 dark:text-white" value={formPedido.taxaEntrega} onChange={e => setFormPedido({...formPedido, taxaEntrega: e.target.value})}/></div></div><div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-green-100 dark:border-slate-600"><label className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase mb-1 block">Pagamento</label><select className="w-full border border-gray-300 dark:border-slate-600 rounded-md py-1 px-2 text-sm font-bold dark:bg-slate-700 dark:text-white" value={formPedido.pagamento} onChange={e => setFormPedido({...formPedido, pagamento: e.target.value})}><option value="Dinheiro">💵 Dinheiro</option><option value="PIX">✨ PIX</option><option value="Cartão">💳 Cartão</option></select></div></div>{formPedido.pagamento === 'Dinheiro' && (<div className="mb-4 bg-green-100 dark:bg-green-900/30 p-3 rounded-xl border-2 border-green-200 dark:border-green-800 flex items-center justify-between"><label className="text-xs font-bold text-green-800 dark:text-green-300">Troco para:</label><input type="number" className="w-20 border-b-2 border-green-300 dark:border-green-600 p-1 font-black text-sm text-green-800 dark:text-green-300 bg-transparent focus:outline-none" placeholder="0,00" value={formPedido.trocoPara} onChange={e => setFormPedido({...formPedido, trocoPara: e.target.value})}/></div>)}<div className="mb-4"><label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 flex items-center gap-1"><Percent size={12}/> Desconto (%)</label><input type="number" className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-lg p-2.5 font-bold dark:bg-slate-700 dark:text-white" placeholder="0" value={formPedido.desconto} onChange={e => setFormPedido({...formPedido, desconto: e.target.value})}/></div><div><label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Obs. Gerais</label><textarea className="w-full border-2 border-gray-200 dark:border-slate-600 rounded-xl p-3 h-16 text-sm bg-white dark:bg-slate-700 dark:text-white" value={formPedido.observacoes} onChange={e => setFormPedido({...formPedido, observacoes: e.target.value})}/></div></Card></form></div><div className="p-5 bg-white dark:bg-slate-800 border-t-2 border-red-100 dark:border-slate-700 flex justify-between items-center"><div><span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Total</span><div className="text-3xl font-black text-red-600 dark:text-red-400">{formatarMoeda(calcularTotal(formPedido.itens, formPedido.taxaEntrega, formPedido.desconto))}</div></div><button onClick={salvarPedido} className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-black py-4 px-10 rounded-full shadow-lg transition-all text-lg flex items-center gap-2">{formPedido.id ? 'SALVAR' : 'LANÇAR'}</button></div></div></div>)}
    </div>
  );
}

export default App;