import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button, Col, Row, Input } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import { deleteGroupPermission, getAllGroupPermissions } from './GroupPermissionModel';
class GroupPermissionList extends Component{
    constructor(props){
        super(props);
        this.state={
            data:[],
        }
        this.refreshList();
    }

    refreshList(){
        getAllGroupPermissions().then((result) =>{
            this.setState({
                data:result
            });
        });
    };

    componentDidUpdate(prevProps, prevState){
        if(prevState.params !== this.state.params){
            this.refreshList();
        }
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.name+"' de grupos?")){
            deleteGroupPermission(row.id).then(res => {
                this.refreshList();
            });
        }
    }

    render(){
        const {data,params} = this.state;
        return(
        <Row>
            <Col lg="4">
                <h4>Usuarios del sistema <i className="bi bi-person-fill"></i></h4>
            </Col>
            <Col lg="1">
                <Link to={"/permission_group/"}>
                    <Button className="btn" color="primary" size="sm" block>
                        <h5 className='mb-0'><i className="bi bi-plus"></i></h5>
                    </Button>
                </Link>
            </Col>
            <Col></Col>
            <Col lg="4">
            </Col>
            <Col lg="12">
                <Table size='sm' className="no-wrap align-middle" responsive striped bordered>
                    <thead>
                        <tr>
                            <th width={"12%"} >ID</th>
                            <th width={"75%"} >Nombre de usuario</th>
                            <th width={"13%"}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr scope="row" key={row.id}>
                                <td>{row.id}</td>
                                <td>
                                    {row.name}
                                </td>
                                <td className='text-center'>
                                    <ButtonGroup>
                                        <Link to={`/permission_group/${row.id}`}>
                                            <Button color="info"
                                                size='sm'>
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                        </Link>
                                        <Button color="danger" 
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
        </Row>)
    }
}
export default function(props) {
    const history = useNavigate();
    return <GroupPermissionList {...props} history={history} />;
}