import React from 'react';

class ErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={hasError:false,error:null}}
  static getDerivedStateFromError(error){return{hasError:true,error}}
  componentDidCatch(err,info){console.error('BIM ErrorBoundary:',err,info)}
  render(){
    if(this.state.hasError)return React.createElement('div',{style:{padding:40,textAlign:'center',color:'#fff',background:'#1a1a2e',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}},
      React.createElement('h2',null,'⚠️ Ocorreu um erro'),
      React.createElement('p',{style:{color:'#94a3b8',maxWidth:500}},String(this.state.error?.message||'Erro desconhecido')),
      React.createElement('button',{onClick:()=>this.setState({hasError:false,error:null}),style:{marginTop:16,padding:'10px 24px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14}},'Tentar novamente'));
    return this.props.children;
  }
}

export default ErrorBoundary;
