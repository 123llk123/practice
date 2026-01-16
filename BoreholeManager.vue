<template>
  <div class="borehole-container">
    <div class="header">
      <h1>钻孔数据管理系统</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd">新增钻孔</el-button>
        <el-button
            type="success"
            @click="exportData"
            :disabled="boreholeList.length === 0"
            style="margin-left: 10px"
        >
          <el-icon><Download /></el-icon> 导出数据
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-area">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
              v-model="searchId"
              placeholder="输入钻孔ID搜索"
              clearable
              @keyup.enter.native="handleSearch"
          ></el-input>
        </el-col>
        <el-col :span="6">
          <el-input
              v-model.number="minDepth"
              placeholder="最小孔深(米)"
              type="number"
              clearable
          ></el-input>
        </el-col>
        <el-col :span="10">
          <el-input
              v-model.number="centerLon"
              placeholder="中心点经度"
              type="number"
              style="width: 32%"
          ></el-input>
          <el-input
              v-model.number="centerLat"
              placeholder="中心点纬度"
              type="number"
              style="width: 32%; margin-left: 2%"
          ></el-input>
          <el-input
              v-model.number="searchRadius"
              placeholder="搜索半径(米)"
              type="number"
              style="width: 32%; margin-left: 2%"
          ></el-input>
        </el-col>
        <el-col :span="2">
          <el-button type="success" @click="handleSearch">搜索</el-button>
        </el-col>
      </el-row>
      <div style="margin-top: 10px; text-align: right;">
        <el-button type="text" @click="resetSearch">重置搜索条件</el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table
        :data="boreholeList"
        border
        stripe
        style="width: 100%; margin-top: 20px"
        empty-text="暂无数据，请添加或调整搜索条件"
        @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="boreholeId" label="钻孔ID" width="100"></el-table-column>
      <el-table-column prop="boreholeName" label="钻孔名称" width="150"></el-table-column>
      <el-table-column prop="longitude" label="经度" width="120"></el-table-column>
      <el-table-column prop="latitude" label="纬度" width="120"></el-table-column>
      <el-table-column prop="depth" label="孔深(米)" width="120"></el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button
              type="primary"
              size="small"
              @click="handleEdit(scope.row)"
              :loading="editLoading"
          >编辑</el-button>
          <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row.boreholeId)"
              style="margin-left: 5px"
              :loading="deleteLoading"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 批量操作提示 -->
    <div v-if="selectedRows.length > 0" class="batch-tip">
      已选择 {{ selectedRows.length }} 条数据
      <el-button
          type="text"
          color="#ff4d4f"
          @click="batchDelete"
          style="margin-left: 10px"
      >
        批量删除
      </el-button>
    </div>

    <!-- 分页 -->
    <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[5, 10, 20]"
        :page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 15px; text-align: right"
    ></el-pagination>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
        :title="dialogTitle"
        v-model="showAddDialog"
        width="500px"
        :close-on-click-modal="false"
        @close="resetForm"
    >
      <template v-if="isEdit">
        <div class="edit-compare-tip">
          <p style="color: #666; font-size: 13px;">
            <el-icon><InfoFilled /></el-icon> 编辑提示：修改后的数据将覆盖原始记录
          </p>
          <div class="original-data" v-if="originalRow">
            <p style="font-size: 12px; color: #999; margin-top: 5px;">
              原始ID：{{ originalRow.boreholeId }}
            </p>
          </div>
        </div>
      </template>

      <el-form
          :model="formData"
          ref="formRef"
          label-width="120px"
          :rules="formRules"
          status-icon
      >
        <el-form-item label="钻孔ID" prop="boreholeId">
          <el-input
              v-model="formData.boreholeId"
              :disabled="isEdit"
              placeholder="如：Y001"
          ></el-input>
        </el-form-item>
        <el-form-item label="钻孔名称" prop="boreholeName">
          <el-input
              v-model="formData.boreholeName"
              placeholder="请输入名称"
          ></el-input>
        </el-form-item>

        <!-- 经度输入框：修复输入绑定 -->
        <el-form-item label="经度" prop="longitude">
          <el-input
              v-model="formData.longitude"
              type="number"
              placeholder="如：120.0"
              step="0.000001"
              @input="handleNumberInput('longitude')"
              @blur="validateField('longitude')"
          ></el-input>
        </el-form-item>

        <!-- 纬度输入框：修复输入绑定 -->
        <el-form-item label="纬度" prop="latitude">
          <el-input
              v-model="formData.latitude"
              type="number"
              placeholder="如：30.0"
              step="0.000001"
              @input="handleNumberInput('latitude')"
              @blur="validateField('latitude')"
          ></el-input>
        </el-form-item>

        <!-- 孔深输入框：修复输入绑定和验证 -->
        <el-form-item label="孔深(米)" prop="depth">
          <el-input
              v-model="formData.depth"
              type="number"
              placeholder="如：256.8"
              step="0.1"
              @input="handleNumberInput('depth')"
              @blur="validateField('depth')"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button
            type="primary"
            @click="submitForm"
            :loading="submitLoading"
        >
          {{ submitLoading ? '处理中...' : '确定' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import { Download, InfoFilled } from '@element-plus/icons-vue';
import ExcelExport from 'js-export-excel';

// 基础配置
const baseUrl = 'http://localhost:8081/api/borehole';

// 数据列表与分页
const boreholeList = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const selectedRows = ref([]);

// 加载状态
const submitLoading = ref(false);
const editLoading = ref(false);
const deleteLoading = ref(false);
const originalRow = ref(null);

// 搜索条件
const searchId = ref('');
const minDepth = ref(null);
const centerLon = ref(null);
const centerLat = ref(null);
const searchRadius = ref(null);

// 弹窗与表单
const showAddDialog = ref(false);
const dialogTitle = ref('新增钻孔');
const isEdit = ref(false);
const formRef = ref(null);

// 表单数据（初始化确保数值类型）
const formData = ref({
  boreholeId: '',
  boreholeName: '',
  longitude: null,  // 数值类型
  latitude: null,   // 数值类型
  depth: null       // 数值类型
});

// 表单验证规则（修复孔深验证）
const formRules = reactive({
  boreholeId: [
    { required: true, message: '请输入钻孔ID', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9]{1,6}$/, message: 'ID只能包含字母和数字，长度1-6位', trigger: 'blur' }
  ],
  boreholeName: [
    { required: true, message: '请输入钻孔名称', trigger: 'blur' },
    { max: 20, message: '名称长度不能超过20位', trigger: 'blur' }
  ],
  longitude: [
    { required: true, message: '请输入经度', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value === null || typeof value !== 'number' || isNaN(value)) {
          callback(new Error('请输入有效的经度数'));
        } else if (value < -180 || value > 180) {
          callback(new Error('经度范围应在-180~180之间'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  latitude: [
    { required: true, message: '请输入纬度', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value === null || typeof value !== 'number' || isNaN(value)) {
          callback(new Error('请输入有效的纬度数'));
        } else if (value < -90 || value > 90) {
          callback(new Error('纬度范围应在-90~90之间'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  depth: [
    { required: true, message: '请输入孔深', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        // 允许0及以上的正数，支持小数
        if (value === null || typeof value !== 'number' || isNaN(value)) {
          callback(new Error('请输入有效的孔深值'));
        } else if (value < 0) {
          callback(new Error('孔深不能为负数'));
        } else {
          // 检查小数位数（最多1位）
          const decimalPart = String(value).split('.')[1] || '';
          if (decimalPart.length > 1) {
            callback(new Error('孔深最多保留1位小数'));
          } else {
            callback();
          }
        }
      },
      trigger: 'blur'
    }
  ]
});

// 页面初始化
onMounted(() => {
  fetchAllBoreholes();
});

// 监听数值变化（清晰显示类型）
watch([() => formData.value.longitude, () => formData.value.latitude, () => formData.value.depth],
    ([lon, lat, depth]) => {
      console.log('数值类型检查:', {
        longitude: { value: lon, type: getValueType(lon) },
        latitude: { value: lat, type: getValueType(lat) },
        depth: { value: depth, type: getValueType(depth) }
      });
    }
);

// 辅助函数：获取值的实际类型（处理null）
const getValueType = (value) => {
  if (value === null) return 'null';
  if (typeof value === 'number' && !isNaN(value)) return 'number';
  return typeof value;
};

// 处理数值输入（确保类型正确且输入流畅）
const handleNumberInput = (field) => {
  const value = formData.value[field];

  // 处理空值
  if (value === '' || value === null || value === undefined) {
    formData.value[field] = null;
    console.log(`${field}已设为null`);
    return;
  }

  // 强制转换为数值
  const numericVal = Number(value);
  if (isNaN(numericVal)) {
    formData.value[field] = null;
    console.log(`${field}输入无效，已设为null`);
    return;
  }

  // 处理精度
  const precision = field === 'depth' ? 1 : 6;
  const fixedVal = Number(numericVal.toFixed(precision));
  formData.value[field] = fixedVal;
  console.log(`${field}转换后的值: ${fixedVal}，类型: number`);
};

// 单独验证字段
const validateField = (field) => {
  if (formRef.value) {
    formRef.value.validateField(field);
  }
};

// 获取所有数据
const fetchAllBoreholes = async () => {
  const loading = ElLoading.service({ text: '加载数据中...' });
  try {
    const res = await axios.get(`${baseUrl}/getAll`);
    boreholeList.value = res.data || [];
    total.value = boreholeList.value.length;
  } catch (error) {
    console.error('获取数据失败:', error);
    ElMessage.error('获取数据失败，请检查后端服务');
    boreholeList.value = [];
    total.value = 0;
  } finally {
    loading.close();
  }
};

// 搜索功能
const handleSearch = async () => {
  const loading = ElLoading.service({ text: '搜索中...' });
  try {
    const params = {};
    if (searchId.value.trim()) params.boreholeId = searchId.value.trim();
    if (minDepth.value !== null && !isNaN(minDepth.value)) params.minDepth = minDepth.value;
    if (
        centerLon.value !== null && !isNaN(centerLon.value) &&
        centerLat.value !== null && !isNaN(centerLat.value) &&
        searchRadius.value !== null && !isNaN(searchRadius.value) &&
        searchRadius.value > 0
    ) {
      params.lon = centerLon.value;
      params.lat = centerLat.value;
      params.radius = searchRadius.value;
    }

    const res = await axios.get(`${baseUrl}/search`, { params });
    boreholeList.value = res.data || [];
    total.value = boreholeList.value.length;
    currentPage.value = 1;
    selectedRows.value = [];

    if (total.value === 0) {
      ElMessage.info('未找到匹配的数据');
    }
  } catch (error) {
    console.error('搜索失败:', error);
    ElMessage.error('搜索失败，请检查参数');
  } finally {
    loading.close();
  }
};

// 重置搜索
const resetSearch = () => {
  searchId.value = '';
  minDepth.value = null;
  centerLon.value = null;
  centerLat.value = null;
  searchRadius.value = null;
  handleSearch();
};

// 新增钻孔
const handleAdd = () => {
  isEdit.value = false;
  dialogTitle.value = '新增钻孔';
  originalRow.value = null;
  resetForm();
  showAddDialog.value = true;
};

// 编辑钻孔
const handleEdit = async (row) => {
  editLoading.value = true;
  try {
    const cloneRow = JSON.parse(JSON.stringify(row));
    originalRow.value = cloneRow;
    isEdit.value = true;
    dialogTitle.value = '编辑钻孔';

    // 强制转换为数值类型
    formData.value = {
      boreholeId: cloneRow.boreholeId || '',
      boreholeName: cloneRow.boreholeName || '',
      longitude: cloneRow.longitude !== null ? Number(Number(cloneRow.longitude).toFixed(6)) : null,
      latitude: cloneRow.latitude !== null ? Number(Number(cloneRow.latitude).toFixed(6)) : null,
      depth: cloneRow.depth !== null ? Number(Number(cloneRow.depth).toFixed(1)) : null
    };

    showAddDialog.value = true;
  } catch (error) {
    console.error('加载编辑数据失败:', error);
    ElMessage.error('加载编辑数据失败');
  } finally {
    editLoading.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  const submitData = {
    boreholeId: formData.value.boreholeId.trim(),
    boreholeName: formData.value.boreholeName.trim(),
    longitude: formData.value.longitude,
    latitude: formData.value.latitude,
    depth: formData.value.depth
  };

  // 新增：打印提交数据（关键排查步骤）
  console.log('提交给后端的数据:', submitData);
  console.log('提交数据类型:', {
    longitude: typeof submitData.longitude,
    latitude: typeof submitData.latitude,
    depth: typeof submitData.depth
  });

  // 表单验证
  try {
    await formRef.value.validate();
  } catch (err) {
    ElMessage.warning('请完善表单信息（标红字段为必填项）');
    return;
  }

  submitLoading.value = true;
  try {
    const submitData = {
      boreholeId: formData.value.boreholeId.trim(),
      boreholeName: formData.value.boreholeName.trim(),
      longitude: formData.value.longitude,
      latitude: formData.value.latitude,
      depth: formData.value.depth
    };

    if (isEdit.value) {
      if (isDataEqual(submitData, originalRow.value)) {
        ElMessage.info('数据未修改，无需提交');
        submitLoading.value = false;
        return;
      }
      await axios.put(`${baseUrl}/update`, submitData);
      ElMessage.success('更新成功');
    } else {
      const exist = boreholeList.value.some(item => item.boreholeId === submitData.boreholeId);
      if (exist) {
        ElMessage.error('该钻孔ID已存在，请更换');
        submitLoading.value = false;
        return;
      }
      await axios.post(`${baseUrl}/add`, submitData);
      ElMessage.success('新增成功');
    }

    showAddDialog.value = false;
    fetchAllBoreholes();
  } catch (error) {
    console.error('提交失败详情:', error);
    const errorMsg = error.response?.data?.message || error.response?.data?.msg || (isEdit.value ? '更新失败' : '新增失败');
    ElMessage.error(errorMsg);
  } finally {
    submitLoading.value = false;
  }
};

// 单个删除
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条数据吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    deleteLoading.value = true;
    await axios.delete(`${baseUrl}/delete/${id}`);
    ElMessage.success('删除成功');
    fetchAllBoreholes();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  } finally {
    deleteLoading.value = false;
  }
};

// 批量删除
const batchDelete = async () => {
  if (selectedRows.value.length === 0) return;

  try {
    const ids = selectedRows.value.map(row => row.boreholeId).join(',');
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条数据吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    deleteLoading.value = true;
    await axios.delete(`${baseUrl}/batchDelete?ids=${ids}`);
    ElMessage.success('批量删除成功');
    selectedRows.value = [];
    fetchAllBoreholes();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error);
      ElMessage.error('批量删除失败');
    }
  } finally {
    deleteLoading.value = false;
  }
};

// 导出数据
const exportData = () => {
  try {
    if (boreholeList.value.length === 0) {
      ElMessage.warning('暂无数据可导出');
      return;
    }

    const exportList = boreholeList.value.map(item => ({
      '钻孔ID': item.boreholeId || '',
      '钻孔名称': item.boreholeName || '',
      '经度': item.longitude !== null ? item.longitude : '',
      '纬度': item.latitude !== null ? item.latitude : '',
      '孔深(米)': item.depth !== null ? item.depth : ''
    }));

    const option = {
      fileName: `钻孔数据_${new Date().toLocaleDateString().replace(/\//g, '-')}`,
      datas: [
        {
          sheetData: exportList,
          sheetName: '钻孔数据',
          sheetHeader: ['钻孔ID', '钻孔名称', '经度', '纬度', '孔深(米)']
        }
      ]
    };

    const excel = new ExcelExport(option);
    excel.saveExcel();
    ElMessage.success('数据导出成功');
  } catch (error) {
    console.error('导出失败详情:', error);
    ElMessage.error('导出失败，请重试');
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  formData.value = {
    boreholeId: '',
    boreholeName: '',
    longitude: null,
    latitude: null,
    depth: null
  };
  isEdit.value = false;
};

// 检查数据是否相等（考虑浮点数精度）
const isDataEqual = (newData, oldData) => {
  return (
      newData.boreholeId === oldData.boreholeId &&
      newData.boreholeName === oldData.boreholeName &&
      Math.abs(newData.longitude - oldData.longitude) < 0.000001 &&
      Math.abs(newData.latitude - oldData.latitude) < 0.000001 &&
      Math.abs(newData.depth - oldData.depth) < 0.1
  );
};

// 表格选择变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows;
};

// 分页事件
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
};
</script>

<style scoped>
.borehole-container {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 40px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.search-area {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.edit-compare-tip {
  margin-bottom: 15px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.original-data {
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px dashed #e5e7eb;
}

.batch-tip {
  margin-top: 10px;
  color: #666;
}
</style>