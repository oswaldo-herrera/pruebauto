import React,{Component} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, ButtonGroup, Button } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
class ExchangeRateList extends Component{
    constructor(props){
        super(props);
        this.handleExchangeRateEdit = this.handleExchangeRateEdit.bind(this);
        this.state={
            data:[],
            params:{
                search: null,
                ordering: null,
                provider:null
            },
        }
    }

    params(){
        if(this.state.params.provider){
            return {
                search: this.state.params.search,
                ordering: this.state.params.ordering?this.state.params.ordering:"-start_date",
                provider: this.state.params.provider,
            }
        } else {
            return {
                search: this.state.params.search,
                ordering: this.state.params.ordering,
                no_provider:true
            }
        }
    }

    refreshList(){
        axios.get(`${ApiUrl}general/exchangerates/`,{
                params: this.params(),
            }).then(res=>{
                this.setState({
                    data:res.data.results
                });
            })
    };

    componentDidMount(){
        let search = this.props.search?this.props.search:"";
        let provider = this.props.provider?this.props.provider.id:null;
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: search,
                    provider: provider
                },
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        if (prevProps.search !== this.props.search || prevProps.provider !== this.props.provider) {
            this.setState(function (prev_State) {
                return {
                    params: {
                        ...prev_State.params,
                        search: this.props.search,
                        provider: this.props.provider? this.props.provider.id:null,
                    },
                };
            });
		} else if(this.checkParams(prevState.params,this.state.params)){
            this.refreshList();
        }
    }

    checkParams(prevParams, currentParams){
        return prevParams.search !== currentParams.search ||
            prevParams.ordering !== currentParams.ordering ||
            prevParams.provider !== currentParams.provider
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.start_date+"' de tipo de cambio?")){
            axios.delete(`${ApiUrl}general/exchangerates/${row.id}/`)
                .then(res => {
                    this.refreshList();
                });
        }
    }

    onColumnClick = (field) => {
        if(this.state.params.ordering === field){
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        ordering: "-"+field
                    },
                };
            });
        } else {
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        ordering: field
                    },
                };
            });
        }
    }

    sortTable = (field) => {
        if(this.state.params.ordering !== null){
            switch(this.state.params.ordering){
                case field:
                    return (<i className="bi bi-sort-alpha-down text-right"></i>)
                case "-"+field:
                    return (<i className="bi bi-sort-alpha-up text-right"></i>)
            }
        }
        return (<></>)
    }

    currencyFormat(num){
        return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

    handleExchangeRateEdit = (event,id) => {
		if(this.props.handleExchangeRateEdit)
			this.props.handleExchangeRateEdit(id);
	}

    render(){
        const data = this.state.data;
        const provider = this.state.params.provider
        return(
            <div>
                <p id="before-table"></p>
                <Table className="no-wrap align-middle" responsive striped bordered id="dataTable">
                    <thead>
                        <tr>
                            <th width={"12%"}>Propiedad</th>
                            {provider?<>
                            <th width={"25%"} onClick={(e)=> this.onColumnClick("start_date")}>Fecha de inicio {this.sortTable("start_date")}</th>
                            <th width={"25%"} onClick={(e)=> this.onColumnClick("usd_currency")}>Tipo de cambio USD ${this.sortTable("usd_currency")}</th>
                            <th width={"25%"} onClick={(e)=> this.onColumnClick("euro_currency")}>Tipo de cambio EURO €{this.sortTable("euro_currency")}</th>
                            </>:<>
                            <th width={"20%"} onClick={(e)=> this.onColumnClick("start_date")}>Fecha de inicio {this.sortTable("start_date")}</th>
                            <th width={"13%"} onClick={(e)=> this.onColumnClick("type")}>Tipo {this.sortTable("type")}</th>
                            <th width={"21%"} onClick={(e)=> this.onColumnClick("usd_currency")}>Tipo de cambio USD ${this.sortTable("usd_currency")}</th>
                            <th width={"21%"} onClick={(e)=> this.onColumnClick("euro_currency")}>Tipo de cambio EURO €{this.sortTable("euro_currency")}</th>
                            </>}
                            <th width={"13%"}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={row.id}>
                                <td>{row.property_name}</td>
                                <td>{moment(row.start_date).format('LL')}</td>
                                {provider?<></>:<td>{row.type=="SALE"?"Ventas":"Comisiones"}</td>}
                                <td>{this.currencyFormat(row.usd_currency)}</td>
                                <td>{this.currencyFormat(row.euro_currency)}</td>
                                <td className='text-center'>
                                    <ButtonGroup>
                                        {provider?
                                        <Button color="info" size='sm' onClick={(e)=>{this.handleExchangeRateEdit(e,row.id)}}>
                                            <i className="bi bi-pencil-fill"></i>
                                        </Button>:
                                        <Link to={`/catalogs/exchangerate/${row.id}`}>
                                            <Button color="info"
                                                size='sm'>
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                        </Link>}
                                        <Button color="warning" 
                                            size='sm'
                                            onClick={(e)=> this.onDeleteRow(row)}>
                                            <i className="bi bi-trash-fill"></i>
                                        </Button>
                                    </ButtonGroup>
                                </td>
                            </tr>
                        ))} 
                    </tbody>
              </Table>
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <ExchangeRateList {...props} history={history} />;
}