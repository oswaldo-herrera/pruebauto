import React,{Component} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, ButtonGroup, Button, FormGroup, Label, InputGroup, Input } from "reactstrap";
import { ApiOperationsUrl, ApiSalesUrl, ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
import { getProfile } from '../user/UserModel';
class SaleLogList extends Component{
    constructor(props){
        super(props);
        this.state={
            data:[],
            params:{
                search: "",
                sale_key: "",
                ordering: "-timestamp",
            },
            form:{
                timestamp: "",
                sale: null,
                user_extension: null,
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
        axios.get(`${ApiSalesUrl}sale_logs/`,{
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
        if(prevState.params !== this.state.params && this.state.params.sale_key !== ""){
            this.refreshList();
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

    onChangeValue(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    [event.target.name]:event.target.value,
                },
            };
        });
	};

    render(){
        const data = this.state.data;
        const params = this.state.params;
        return(
            <div>
                <FormGroup className="my-1 w-25">
                    <Label size='sm'>Cupon#</Label>
                    <InputGroup>
                        <Input
                            bsSize="sm"
                            name="sale_key"
                            placeholder="Cupon#"
                            type="number"
                            value={params.sale_key}
                            onChange={this.onChangeValue.bind(this)}/>
                        <Button size='sm'
                            color='primary'
                            onClick={(e)=> this.refreshList()}>
                            <i className="bi bi-search"></i>
                        </Button>
                    </InputGroup>
                </FormGroup>
                <p id="before-table"></p>
                <Table size='sm' className="no-wrap align-middle" responsive striped bordered id="dataTable">
                    <thead>
                        <tr>
                            <th width={"14%"} onClick={(e)=> this.onColumnClick("timestamp")}>Fecha {this.sortTable("timestamp")}</th>
                            <th width={"10%"}>Cupon </th>
                            <th width={"17%"} onClick={(e)=> this.onColumnClick("type")}>Acción {this.sortTable("type")}</th>
                            <th width={"12%"} onClick={(e)=> this.onColumnClick("user_extension__user__username")}>Usuario {this.sortTable("user_extension__user__username")}</th>
                            <th width={"12%"} onClick={(e)=> this.onColumnClick("field")}>Campo {this.sortTable("field")}</th>
                            <th width={"17.5%"} onClick={(e)=> this.onColumnClick("old_data")}>Registro anterior {this.sortTable("old_data")}</th>
                            <th width={"17.5%"} onClick={(e)=> this.onColumnClick("new_data")}>Nuevo registro {this.sortTable("new_data")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={row.id}>
                                <td>{moment(row.timestamp).format('YYYY-MM-DD h:mm:ss a')}</td>
                                <td>{row.status}{row.sale_key.toString().padStart(8, '0')}</td>
                                <td>{row.type}</td>
                                <td>{row.user_extension_name}</td>
                                <td>{row.field?row.field:""}</td>
                                <td>{row.old_data?row.old_data:""}</td>
                                <td>{row.new_data?row.new_data:""}</td>
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
    return <SaleLogList {...props} history={history} />;
}