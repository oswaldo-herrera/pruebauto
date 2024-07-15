import React,{Component} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, ButtonGroup, Button, Row, Col, Input } from "reactstrap";
import { ApiSalesUrl, ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import StoreCardChargeForm from './StoreCardChargeForm';
class StoreCardChargeList extends Component{
    constructor(props){
        super(props);
        this.handleStoreCardChargeEdit = this.handleStoreCardChargeEdit.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.state={
            data:[],
            params:{
                search: null,
                ordering: "-timestamp",
                store_card:null
            },
            form:false,
            id:null
        }
    }

    addNewCharge = (row) =>{
        this.setState({
            form:true,
            id:null,
        });
    }

    onChangeSearch(e) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: e.target.value,
                },
            };
        });
	};

    refreshList(){
        if(this.state.params.store_card)
            axios.get(`${ApiSalesUrl}store_card_charges/`,{
                params: this.state.params,
            }).then(res=>{
                this.setState({
                    data:res.data.results
                });
            })
    };

    componentDidMount(){
        let store_card = this.props.store_card?this.props.store_card.id:null;
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    store_card: store_card
                },
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        let store_card = this.props.store_card?this.props.store_card:null;
        if (prevState.params.store_card !== this.props.store_card) {
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        store_card: store_card,
                    },
                };
            });
		}
        if(this.checkParams(prevState.params,this.state.params)){
            this.refreshList();
        }
    }

    checkParams(prevParams, currentParams){
        return prevParams.search !== currentParams.search ||
            prevParams.ordering !== currentParams.ordering ||
            prevParams.store_card !== currentParams.store_card
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.id+"' de cargos a monedero?")){
            axios.delete(`${ApiSalesUrl}store_card_charges/${row.id}/`)
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

    handleStoreCardChargeEdit = (event,id) => {
		this.setState({
            form:true,
            id:id,
        });
	}

    handleSave = () => {
        this.setState({
            form:false,
            id:null,
        });
        this.refreshList();
	}

    render(){
        const {data,id,form} = this.state;
        const {search,store_card} = this.state.params;
        return(
            <Row>
				<Col lg="2">
                    <Button className="btn" color="primary" size="sm" block onClick={(e)=> this.addNewCharge()}>
						<h5 className='mb-0'><i className="bi bi-plus"></i></h5>
					</Button>
				</Col>
				<Col></Col>
				<Col lg="4">
					<Input
						bsSize="sm"
						name="search"
						placeholder="Busqueda"
						type="search"
						value={search}
						onChange={this.onChangeSearch.bind(this)}/>
				</Col>
                {form?
                <Col lg="12" className={"pb-3 border-bottom"}>
                    <StoreCardChargeForm handleSave={this.handleSave} store_card={store_card} id={id} />
                </Col>:<></>}
				<Col lg="12">
                <p id="before-table"></p>
                    <Table className="no-wrap align-middle" responsive striped bordered id="dataTable">
                        <thead>
                            <tr>
                                <th width={"16%"} onClick={(e)=> this.onColumnClick("timestamp")}>Fecha de registro{this.sortTable("timestamp")}</th>
                                <th width={"13%"} onClick={(e)=> this.onColumnClick("amount")}>Monto {this.sortTable("amount")}</th>
                                <th width={"15%"}>Venta</th>
                                <th width={"18%"}>Propiedad</th>
                                <th width={"35%"} onClick={(e)=> this.onColumnClick("comments")}>Comentarios{this.sortTable("comments")}</th>
                                <th width={"13%"}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{moment(row.timestamp).format('DD/MM/YY h:mm:ss a')}</td>
                                    <td>${this.currencyFormat(row.amount)}</td>
                                    <td>{row.sale}</td>
                                    <td>{row.property_name_sale}</td>
                                    <td>{row.comments}</td>
                                    <td className='text-center'>
                                        <ButtonGroup>
                                            <Button color="info" size='sm' onClick={(e)=>{this.handleStoreCardChargeEdit(e,row.id)}}>
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
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
                </Col>
			</Row>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <StoreCardChargeList {...props} history={history} />;
}