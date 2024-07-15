import React,{Component} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, ButtonGroup, Button } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
import { getProfile } from '../user/UserModel';
class AuthDiscountList extends Component{
    constructor(props){
        super(props);
        this.state={
            data:[],
            params:{
                search: "",
                ordering: "-timestamp",
            },
            form:{
                timestamp: "",
                sale: null,
                user_extension: null,
            },
            modal_properties:{
                type:'property',
                filter:"VP",
                isopen:false,
                value:null
            },
        }
        getProfile().then(res => {
            this.setState(function (prev_State) {
                return {
                    form: {
                        ...prev_State.form,
                        user_extension: res.id,
                    },
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: true,
                    },
                };
            });
        });
    }

    refreshList(){
        axios.get(`${ApiUrl}sales/auth_discounts/`,{
                params: this.state.params,
            }).then(res=>{
                this.setState({
                    data:res.data.results
                });
            })
    };

    onAddAuthDiscount = () =>{
        if(window.confirm("¿Agregar nueva autorizacion de descuentos?")){
            axios.post(`${ApiUrl}sales/auth_discounts/`, this.state.form)
            .then(res => {
                this.refreshList();
            })
        }
    }

    componentDidMount(){
        let search = this.props.search?this.props.search:"";
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: search
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
                        search: this.props.search
                    },
                };
            });
		}
        if(prevState.params !== this.state.params){
            this.refreshList();
            this.setState({
                modal_properties:{
                    type:'property',
                    filter:"VP",
                    isopen:false,
                    value:null
                },
            });
        }
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.conditional_name+"' de Autorizacion de descuentos?")){
            axios.delete(`${ApiUrl}sales/auth_discounts/${row.id}/`)
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

    handlePropertyClose = () => {
        this.setState(function (prev_State) {
            return {
                modal_properties: {
                    ...prev_State.modal_properties,
                    isopen: false,
                },
            };
        });
	}

    handleAsignment = (value) => {
        this.setState(
            (prev_State) =>{
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: false,
                    },
                    form:{
                        ...prev_State.form,
                        property:value
                    }
                };
            }
        );
	}

    render(){
        const data = this.state.data;
        const modal_properties = this.state.modal_properties
        return(
            <div>
                <Button className="btn my-1 w-25" color="primary" size="sm" onClick={(e)=> this.onAddAuthDiscount()}>
					<h5 className='mb-0'>Autorizar nuevo descuento<i className="bi bi-plus"></i></h5>
				</Button>
                <ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />
                <p id="before-table"></p>
                <Table size='sm' className="no-wrap align-middle" responsive striped bordered id="dataTable">
                    <thead>
                        <tr>
                            <th width={"14%"} onClick={(e)=> this.onColumnClick("timestamp")}>Fecha {this.sortTable("timestamp")}</th>
                            <th width={"14%"} onClick={(e)=> this.onColumnClick("discount_key")}>Clave descuento  {this.sortTable("discount_key")}</th>
                            <th width={"12%"} onClick={(e)=> this.onColumnClick("sale__sale_key")}>Cupon {this.sortTable("sale__sale_key")}</th>
                            <th width={"11%"} onClick={(e)=> this.onColumnClick("user_extension__name")}>Autoriza {this.sortTable("user_extension__user__username")}</th>
                            <th width={"11%"} onClick={(e)=> this.onColumnClick("sale__discount")}>Descuento {this.sortTable("sale__discount")}</th>
                            <th width={"11%"} onClick={(e)=> this.onColumnClick("sale__discount_type")}>Tipo {this.sortTable("sale__discount_type")}</th>
                            <th width={"20%"} onClick={(e)=> this.onColumnClick("sale__representative__name")}>Rep {this.sortTable("sale__representative__name")}</th>
                            <th width={"7%"}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={row.id}>
                                <td>{moment(row.timestamp).format('YYYY-MM-DD h:mm:ss a')}</td>
                                <td>{row.discount_key}</td>
                                <td>{row.sale_key?row.sale_key.toString().padStart(8, '0'):""}</td>
                                <td>{row.user_extension_name}</td>
                                <td>{row.discount}</td>
                                <td>{row.discount_type?row.discount_type==="percent"?"%":"monto":""}</td>
                                <td>{row.representative_name}</td>
                                <td className='text-center'>
                                    <Button color="warning" 
                                        size='sm'
                                        onClick={(e)=> this.onDeleteRow(row)}>
                                        <i className="bi bi-trash-fill"></i>
                                    </Button>
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
    return <AuthDiscountList {...props} history={history} />;
}