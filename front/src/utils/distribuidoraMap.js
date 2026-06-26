const distribuidoraMap = {
    'DISTRIBUIDORA DE MEDICAMENTOS SANTA CRUZ LTDA': 'Santa Cruz',
    'PROFARMA DIST. PROD. FARMACEUTICOS': 'Profarma',
    'SC DISTRIBUICAO LTDA': 'Panpharma',
    'D CENTER DISTRIBUIDORA LTDA.': 'D.Center',
    'SOLFARMA COMERCIO DE PRODUTOS FARMACEUTICOS S.A.': 'Solfarma',
    'J.K. MEDICAMENTOS LTDA': 'JK',
    'SERVIMED COMERCIAL LTDA': 'Servimed',
    'KEEP COMMERCE ATACADISTA DE COSMETICOS LTDA': 'Keep Commerce',
    'TOPSERVICE DISTRIBUIDORA':'TopService',
    'MANTIQUEIRA DISTRIBUIDORA DE PRODUTOS DE HIGIENE LTDA':'Mantiqueira',
    'MILFARMA COMERCIAL LTDA 08241229000200':'Milfarma'
  }

const normalize = (str) => (str || '').toUpperCase().trim()

export { normalize }
export default distribuidoraMap