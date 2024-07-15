import React,{Component} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, ButtonGroup, Button } from "reactstrap";
import { ApiSalesUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
class ExchangeRateList extends Component{
    constructor(props){
        super(props);
        this.state={
            data:[],
            params:{
                search: null,
                ordering: "-date",
                limit: 200,
            },
        }
    }

    refreshList(){
        axios.get(`${ApiSalesUrl}coordinators_comissions/`,{
                params: this.state.params,
            }).then(res=>{
                this.setState({
                    data:res.data.results
                });
            })
    };

    componentDidMount(){
        let search = this.props.search?this.props.search:"";
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: search,
                },
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        if (prevProps.search !== this.props.search) {
            this.setState(function (prev_State) {
                return {
                    params: {
                        ...prev_State.params,
                        search: this.props.search,
                    },
                };
            });
		}
        if(prevState.params !== this.state.params){
            this.refreshList();
        }
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.date+"' de comisiones a cordinadores?")){
            axios.delete(`${ApiSalesUrl}coordinators_comissions/${row.id}/`)
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
        return(
            <div>
                <p id="before-table"></p>
                <Table className="no-wrap align-middle" responsive striped bordered id="dataTable">
                    <thead>
                        <tr>
                            <th width={"15%"}>Propiedad</th>
                            <th width={"12%"} onClick={(e)=> this.onColumnClick("id")}>ID {this.sortTable("id")}</th>
                            <th width={"30%"} onClick={(e)=> this.onColumnClick("date")}>Fecha {this.sortTable("date")}</th>
                            <th width={"30%"} onClick={(e)=> this.onColumnClick("comission")}>Comisión %{this.sortTable("comission")}</th>
                            <th width={"13%"}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={row.id}>
                                <td>{row.property_name}</td>
                                <td>{row.id}</td>
                                <td>{moment(row.date).format('LL')}</td>
                                <td>{this.currencyFormat(row.comission)}</td>
                                <td className='text-center'>
                                    <ButtonGroup>
                                        <Link to={`/catalogs/coordinators_comission/${row.id}`}>
                                            <Button color="info"
                                                size='sm'>
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                        </Link>
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