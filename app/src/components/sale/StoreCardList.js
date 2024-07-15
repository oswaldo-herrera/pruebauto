import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button, Row, Col, Input  } from "reactstrap";
import { ApiSalesUrl, ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
class CardStoreList extends Component{
    constructor(props){
        super(props);
        this.state={
            data:[],
            params:{
                search: "",
                ordering: null,
            }
        }
    }

    refreshList(){
        axios.get(`${ApiSalesUrl}store_cards/`,{
                params: this.state.params,
            }).then(res=>{
                this.setState({
                    data:res.data.results
                });
            })
    };

    componentDidMount(){
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: ""
                },
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        if(prevState.params !== this.state.params){
            this.refreshList();
        }
    }

    onSendEmailCardRow = (row) =>{
        if(window.confirm("¿Desea enviar la monedero '"+row.card_key.toString().padStart(8, '0')+"' por correo?")){
            axios.get(`${ApiSalesUrl}store_card_send_email/${row.id}/`)
            .then(res => {
                alert("Se ha enviado el correo.");
                this.refreshList();
            });
        }
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.card_key.toString().padStart(8, '0')+"' de los monederos?")){
            axios.delete(`${ApiSalesUrl}store_cards/${row.id}/`)
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

    currencyFormat(num){
        return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

    render(){
        const { data, params} = this.state;
        const store_card_status = {
            active:'Activa',
            inactive:'Inactiva',
            lost:'Perdida',
        }
        return(
            <Row>
                <Col lg="2">
                    <Link to={"/store_card/"}>
						<Button className="btn" color="primary" size="sm" block>
							<h5 className='mb-0'><i className="bi bi-plus"></i></h5>
						</Button>
					</Link>
                </Col>
                <Col></Col>
                <Col lg="4">
					<Input
						bsSize="sm"
						name="search"
						placeholder="Busqueda"
						type="search"
						value={params.search}
						onChange={this.onChangeSearch.bind(this)}/>
				</Col>
                <Col lg="12">
                    <p id="before-table"></p>
                    <Table size='sm' className="no-wrap align-middle" responsive striped bordered id="dataTable">
                        <thead>
                            <tr>
                                <th width={"16%"} onClick={(e)=> this.onColumnClick("card_key")}>Monedero# {this.sortTable("card_key")}</th>
                                <th width={"20%"} onClick={(e)=> this.onColumnClick("name_pax")}>Nombre {this.sortTable("name_pax")}</th>
                                <th width={"17%"} onClick={(e)=> this.onColumnClick("timestamp")}>Fecha de registro{this.sortTable("timestamp")}</th>
                                <th width={"17%"} onClick={(e)=> this.onColumnClick("due_date")}>Fecha de vencimiento{this.sortTable("due_date")}</th>
                                <th width={"8%"} onClick={(e)=> this.onColumnClick("status")}>Estatus {this.sortTable("status")}</th>
                                <th width={"12%"}>Saldo</th>
                                <th width={"10%"}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{row.card_key.toString().padStart(8, '0')}</td>
                                    <td>{row.name_pax}</td>
                                    <td>{moment(row.timestamp.substring(0, 10)).format('DD/MM/YYYY')}</td>
                                    <td>{row.due_date?moment(row.due_date).format('DD/MM/YYYY'):""}</td>
                                    <td>{store_card_status[row.status]}</td>
                                    <td>${this.currencyFormat(row.total)}</td>
                                    <td className='text-center'>
                                        <ButtonGroup>
                                            <Link to={`/store_card/${row.id}`}>
                                                <Button color="info"
                                                    size='sm'>
                                                    <i className="bi bi-pencil-fill"></i>
                                                </Button>
                                            </Link>
                                            <Button color="primary"
                                                size='sm'
                                                onClick={(e)=> this.onSendEmailCardRow(row)}>
                                                <i className="bi bi-envelope-fill"></i>
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
    return <CardStoreList {...props} history={history} />;
}