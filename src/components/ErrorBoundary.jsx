import React from 'react';

class ErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={hasError:false,error:null}}
  static getDerivedStateFromError(error){return{hasError:true,error}}
  componentDidCatch(err,info){console.error('BIM ErrorBoundary:',err,info)}
  render(){
    if(this.state.hasError)return React.createElement('div',{style:{padding:40,textAlign:'center',color:'#1e293b',background:'#F0F5FA',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'Inter,system-ui,sans-serif'}},
      React.createElement('h2',{style:{color:'#1e293b',marginBottom:8}},'⚠️ Ocorreu um erro'),
      React.createElement('p',{style:{color:'#64748b',maxWidth:500,lineHeight:1.6,fontSize:14}},String(this.state.error?.message||'Erro desconhecido')),
      React.createElement('button',{onClick:()=>this.setState({hasError:false,error:null}),style:{marginTop:16,padding:'10px 24px',background:'#046BD2',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:600}},'Tentar novamente'));
    return this.props.children;
  }
}

export default ErrorBoundary;
